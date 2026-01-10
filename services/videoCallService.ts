/**
 * Serviço de Videochamadas
 * WebRTC, salas virtuais, gravação
 */

import { logger } from '../utils/logger';

export interface VideoRoom {
  id: string;
  name: string;
  hostId: string;
  participants: string[];
  isRecording: boolean;
  createdAt: string;
}

export interface VideoCallConfig {
  audio: boolean;
  video: boolean;
  screenShare?: boolean;
}

class VideoCallService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private rooms: VideoRoom[] = [];

  /**
   * Cria uma sala de videochamada
   */
  async createRoom(name: string, hostId: string): Promise<VideoRoom> {
    const room: VideoRoom = {
      id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      hostId,
      participants: [hostId],
      isRecording: false,
      createdAt: new Date().toISOString(),
    };

    this.rooms.push(room);
    logger.info(`Sala criada: ${room.id}`, 'videoCallService');
    return room;
  }

  /**
   * Entra em uma sala
   */
  async joinRoom(roomId: string, userId: string): Promise<VideoRoom | null> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return null;

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
    }

    return room;
  }

  /**
   * Inicia captura de mídia local
   */
  async startLocalStream(config: VideoCallConfig): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: config.audio,
        video: config.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      logger.info('Stream local iniciado', 'videoCallService');
      return stream;
    } catch (error) {
      logger.error('Erro ao iniciar stream local', 'videoCallService', error);
      throw error;
    }
  }

  /**
   * Para stream local
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      logger.info('Stream local parado', 'videoCallService');
    }
  }

  /**
   * Inicia compartilhamento de tela
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      logger.info('Compartilhamento de tela iniciado', 'videoCallService');
      return stream;
    } catch (error) {
      logger.error('Erro ao iniciar compartilhamento de tela', 'videoCallService', error);
      throw error;
    }
  }

  /**
   * Cria peer connection
   */
  createPeerConnection(userId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    this.peerConnections.set(userId, pc);
    return pc;
  }

  /**
   * Inicia gravação
   */
  async startRecording(roomId: string): Promise<boolean> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return false;

    // Em produção, usar MediaRecorder API
    room.isRecording = true;
    logger.info(`Gravação iniciada na sala ${roomId}`, 'videoCallService');
    return true;
  }

  /**
   * Para gravação
   */
  async stopRecording(roomId: string): Promise<Blob | null> {
    const room = this.rooms.find(r => r.id === roomId);
    if (!room) return null;

    room.isRecording = false;
    logger.info(`Gravação parada na sala ${roomId}`, 'videoCallService');
    // Em produção, retornar blob da gravação
    return null;
  }

  /**
   * Obtém salas disponíveis
   */
  getRooms(): VideoRoom[] {
    return this.rooms;
  }

  /**
   * Obtém sala por ID
   */
  getRoom(roomId: string): VideoRoom | null {
    return this.rooms.find(r => r.id === roomId) || null;
  }
}

// Instância singleton
export const videoCallService = new VideoCallService();

