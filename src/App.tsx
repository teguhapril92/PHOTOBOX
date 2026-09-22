/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CollageType,
  FrameTemplate,
  KioskOrientation,
  PhotoFilter,
  ScreenStep,
} from './types';
import { BUILTIN_TEMPLATES } from './services/templates';
import {
  testFirestoreConnection,
  savePhotoToFirestore,
  saveTemplateToFirestore,
  getTemplateFromFirestore,
} from './services/firebase';
import { StartScreen } from './components/StartScreen';
import { CollageSelectScreen } from './components/CollageSelectScreen';
import { TemplateSelectScreen } from './components/TemplateSelectScreen';
import { CameraSessionScreen } from './components/CameraSessionScreen';
import { ResultPreviewScreen } from './components/ResultPreviewScreen';
import { DownloadQrScreen } from './components/DownloadQrScreen';
import { MobileDownloadView } from './components/MobileDownloadView';

export default function App() {
  // Check if viewing mobile download page directly
  const [mobilePhotoId, setMobilePhotoId] = useState<string | null>(null);

  // Kiosk Flow States
  const [currentStep, setCurrentStep] = useState<ScreenStep>('start');
  const [selectedCollage, setSelectedCollage] = useState<CollageType>('strip');
  const [selectedTemplate, setSelectedTemplate] = useState<FrameTemplate>(
    BUILTIN_TEMPLATES.find((t) => t.id === 'plesir_strip') || BUILTIN_TEMPLATES[0]
  );
  const [customTemplate, setCustomTemplate] = useState<FrameTemplate | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [finalCompositeUrl, setFinalCompositeUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [viewUrl, setViewUrl] = useState<string>('');
  const [orientation, setOrientation] = useState<KioskOrientation>('auto');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);

  // Detect URL path or query parameter for mobile download scan
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/p\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      setMobilePhotoId(match[1]);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const qPhotoId = params.get('photoId') || params.get('id');
    if (qPhotoId) {
      setMobilePhotoId(qPhotoId);
    }
  }, []);

  // Check camera status initially
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const hasVideo = devices.some((d) => d.kind === 'videoinput');
          setHasCameraPermission(hasVideo);
        })
        .catch(() => setHasCameraPermission(true));
    }
  }, []);

  // Test Firestore connection on startup
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Restore saved custom PLESIR.png as default from LocalStorage & Firebase Firestore
  useEffect(() => {
    const applyDataUrlAsCustomTemplate = (dataUrl: string) => {
      const img = new Image();
      img.onload = () => {
        const custom: FrameTemplate = {
          id: 'custom_plesir_saved',
          title: 'PLESIR.png (Asli)',
          theme: 'Desain Asli PNG',
          accentColor: '#38BDF8',
          isCustom: true,
          customDataUrl: dataUrl,
          description: 'Template gambar asli tanpa perubahan.',
          renderOverlay: (ctx, width, height) => {
            ctx.drawImage(img, 0, 0, width, height);
          },
        };
        setCustomTemplate(custom);
        if (selectedCollage === 'strip') {
          setSelectedTemplate(custom);
        }
      };
      img.src = dataUrl;
    };

    // 1. Check local storage
    try {
      const savedDataUrl = localStorage.getItem('plesir_custom_template_dataUrl');
      if (savedDataUrl) {
        applyDataUrlAsCustomTemplate(savedDataUrl);
      }
    } catch {
      // Ignore storage errors
    }

    // 2. Also check Cloud Firestore for persistent synced template
    getTemplateFromFirestore('plesir_template')
      .then((data) => {
        if (data && data.dataUrl) {
          applyDataUrlAsCustomTemplate(data.dataUrl);
        }
      })
      .catch(() => {});
  }, [selectedCollage]);

  // Save composite photo to backend server and obtain unique URL & QR destination
  const handleConfirmPreview = async (compositeDataUrl: string, filter: PhotoFilter) => {
    setFinalCompositeUrl(compositeDataUrl);
    let assignedId = `photo_${Date.now()}`;
    setPhotoId(assignedId);
    setDownloadUrl(compositeDataUrl);
    setViewUrl(`${window.location.origin}/p/${assignedId}`);
    setCurrentStep('download');

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl: compositeDataUrl,
          collageType: selectedCollage,
          templateName: selectedTemplate.title,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        assignedId = data.id;
        setPhotoId(data.id);
        setDownloadUrl(data.downloadUrl);
        setViewUrl(data.viewUrl);
      }
    } catch {
      // Fallback local already set
    }

    // Persist to Cloud Firestore for durable cloud storage
    savePhotoToFirestore({
      id: assignedId,
      dataUrl: compositeDataUrl,
      collageType: selectedCollage,
      templateName: selectedTemplate.title,
      createdAt: new Date().toISOString(),
    }).catch((err) => {
      console.warn('Firestore photo save notice:', err);
    });
  };

  const handleResetToStart = useCallback(() => {
    setCapturedPhotos([]);
    setFinalCompositeUrl(null);
    setPhotoId('');
    setCurrentStep('start');
  }, []);

  // If in mobile download view mode
  if (mobilePhotoId) {
    return <MobileDownloadView photoId={mobilePhotoId} />;
  }

  // Orientation container wrapper styling for PID simulation
  const getContainerStyle = () => {
    if (orientation === 'portrait') {
      return 'max-w-[620px] max-h-[96vh] aspect-[9/16] rounded-3xl border-4 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]';
    }
    if (orientation === 'landscape') {
      return 'max-w-[1280px] max-h-[92vh] aspect-[16/9] rounded-3xl border-4 border-neutral-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]';
    }
    return 'w-full h-full';
  };

  return (
    <div className="w-screen h-screen bg-neutral-950 flex items-center justify-center overflow-hidden font-sans">
      <div className={`relative w-full h-full overflow-hidden flex flex-col bg-neutral-950 transition-all duration-300 ${getContainerStyle()}`}>
        {currentStep === 'start' && (
          <StartScreen
            onStart={() => setCurrentStep('collage')}
            orientation={orientation}
            onChangeOrientation={setOrientation}
            hasCameraPermission={hasCameraPermission}
          />
        )}

        {currentStep === 'collage' && (
          <CollageSelectScreen
            selectedCollage={selectedCollage}
            onSelectCollage={(collage) => {
              setSelectedCollage(collage);
              if (collage === 'strip') {
                const plesir = BUILTIN_TEMPLATES.find((t) => t.id === 'plesir_strip');
                if (plesir) setSelectedTemplate(plesir);
              } else if (collage === 'grid') {
                const passport = BUILTIN_TEMPLATES.find((t) => t.id === 'passport_continents');
                if (passport) setSelectedTemplate(passport);
              }
            }}
            onNext={() => setCurrentStep('template')}
            onBack={() => setCurrentStep('start')}
          />
        )}

        {currentStep === 'template' && (
          <TemplateSelectScreen
            selectedCollage={selectedCollage}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            customTemplate={customTemplate}
            onUploadCustomTemplate={(t) => {
              setCustomTemplate(t);
              if (t.customDataUrl) {
                saveTemplateToFirestore({
                  id: 'plesir_template',
                  title: t.title,
                  dataUrl: t.customDataUrl,
                  collageType: selectedCollage,
                  createdAt: new Date().toISOString(),
                }).catch((err) => console.warn('Firestore template save error:', err));
              }
            }}
            onNext={() => setCurrentStep('camera')}
            onBack={() => setCurrentStep('collage')}
          />
        )}

        {currentStep === 'camera' && (
          <CameraSessionScreen
            collageType={selectedCollage}
            template={selectedTemplate}
            onPhotosCaptured={(photos) => {
              setCapturedPhotos(photos);
              setCurrentStep('preview');
            }}
            onCancel={() => setCurrentStep('template')}
          />
        )}

        {currentStep === 'preview' && (
          <ResultPreviewScreen
            collageType={selectedCollage}
            capturedPhotos={capturedPhotos}
            template={selectedTemplate}
            onRetake={() => setCurrentStep('camera')}
            onConfirm={handleConfirmPreview}
          />
        )}

        {currentStep === 'download' && (
          <DownloadQrScreen
            finalImageUrl={finalCompositeUrl || ''}
            photoId={photoId}
            downloadUrl={downloadUrl}
            viewUrl={viewUrl}
            onFinishNow={handleResetToStart}
          />
        )}
      </div>
    </div>
  );
}
