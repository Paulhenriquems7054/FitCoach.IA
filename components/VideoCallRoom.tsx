/**
 * Componente de Sala de Videochamada
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { videoCallService, VideoCallConfig } from '../services/videoCallService';
import { logger } from '../utils/logger';
import { useUser } from '../context/UserContext';

export interface VideoCallRoomProps {
  roomId: string;
  onLeave?: () => void;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  roomId,
  onLeave,
}) => {
  const { user } = useUser();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    startCall();
    return () => {
      stopCall();
    };
  }, []);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const startCall = async () => {
    try {
      const config: VideoCallConfig = {
        audio: true,
        video: true,
      };
      const stream = await videoCallService.startLocalStream(config);
      setLocalStream(stream);
    } catch (error) {
      logger.error('Erro ao iniciar chamada', 'VideoCallRoom', error);
    }
  };

  const stopCall = () => {
    videoCallService.stopLocalStream();
    setLocalStream(null);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Parar compartilhamento
        setIsScreenSharing(false);
      } else {
        const stream = await videoCallService.startScreenShare();
        setLocalStream(stream);
        setIsScreenSharing(true);
      }
    } catch (error) {
      logger.error('Erro ao compartilhar tela', 'VideoCallRoom', error);
    }
  };

  const handleLeave = () => {
    stopCall();
    onLeave?.();
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Vídeos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vídeo Local */}
          <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
              {user?.nome || 'Você'}
            </div>
          </div>

          {/* Vídeos Remotos */}
          {remoteStreams.map((stream, index) => (
            <div
              key={index}
              className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video"
            >
              <video
                ref={el => {
                  if (el) {
                    remoteVideoRefs.current.set(`remote-${index}`, el);
                    el.srcObject = stream;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Controles */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant={isMuted ? 'secondary' : 'primary'}
            onClick={toggleMute}
            size="lg"
          >
            {isMuted ? '🔇' : '🎤'}
          </Button>
          <Button
            variant={isVideoOff ? 'secondary' : 'primary'}
            onClick={toggleVideo}
            size="lg"
          >
            {isVideoOff ? '📷❌' : '📷'}
          </Button>
          <Button
            variant={isScreenSharing ? 'primary' : 'secondary'}
            onClick={handleScreenShare}
            size="lg"
          >
            🖥️
          </Button>
          <Button
            variant="danger"
            onClick={handleLeave}
            size="lg"
          >
            Sair
          </Button>
        </div>
      </div>
    </Card>
  );
};

