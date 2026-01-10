/**
 * Serviço de Comunidade e Rede Social
 * Sistema completo de feed, posts, comentários, grupos e chat
 */

import { logger } from '../utils/logger';
import { getAppSetting, saveAppSetting } from './databaseService';

export interface Post {
  id: string;
  userId: string;
  username: string;
  userPhotoUrl?: string;
  content: string;
  images?: string[];
  type: 'progress' | 'workout' | 'meal' | 'achievement' | 'motivation' | 'question';
  tags: string[];
  likes: string[]; // IDs de usuários que curtiram
  comments: Comment[];
  shares: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userPhotoUrl?: string;
  content: string;
  likes: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: 'weight-loss' | 'muscle-gain' | 'fitness' | 'nutrition' | 'general';
  members: string[]; // IDs de usuários
  admins: string[]; // IDs de administradores
  isPublic: boolean;
  createdAt: string;
  createdBy: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  username: string;
  userPhotoUrl?: string;
  type: 'post' | 'comment' | 'like' | 'follow' | 'achievement';
  targetId: string;
  targetType: 'post' | 'user' | 'achievement';
  content?: string;
  createdAt: string;
}

class CommunityService {
  private posts: Post[] = [];
  private groups: Group[] = [];
  private follows: Follow[] = [];
  private activities: Activity[] = [];

  /**
   * Inicializa o serviço
   */
  async initialize(): Promise<void> {
    await this.loadData();
  }

  /**
   * Cria um novo post
   */
  async createPost(
    userId: string,
    username: string,
    post: Omit<Post, 'id' | 'userId' | 'username' | 'likes' | 'comments' | 'shares' | 'createdAt'>
  ): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username,
      likes: [],
      comments: [],
      shares: 0,
      createdAt: new Date().toISOString(),
    };

    this.posts.unshift(newPost); // Adicionar no início
    await this.savePosts();

    // Criar atividade
    await this.createActivity({
      userId,
      username,
      type: 'post',
      targetId: newPost.id,
      targetType: 'post',
      content: newPost.content.substring(0, 100),
    });

    logger.info(`Post criado: ${newPost.id}`, 'communityService');
    return newPost;
  }

  /**
   * Obtém feed de posts
   */
  async getFeed(userId: string, limit: number = 20): Promise<Post[]> {
    // Em produção, filtrar por usuários seguidos
    const followingIds = await this.getFollowing(userId);
    const followingIdsSet = new Set(followingIds);
    followingIdsSet.add(userId); // Incluir posts próprios

    return this.posts
      .filter(post => followingIdsSet.has(post.userId))
      .slice(0, limit);
  }

  /**
   * Obtém posts de um usuário
   */
  async getUserPosts(userId: string): Promise<Post[]> {
    return this.posts.filter(post => post.userId === userId);
  }

  /**
   * Adiciona comentário a um post
   */
  async addComment(
    userId: string,
    username: string,
    postId: string,
    content: string
  ): Promise<Comment> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) {
      throw new Error('Post não encontrado');
    }

    const comment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      postId,
      userId,
      username,
      content,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    post.comments.push(comment);
    await this.savePosts();

    // Criar atividade
    await this.createActivity({
      userId,
      username,
      type: 'comment',
      targetId: postId,
      targetType: 'post',
      content: content.substring(0, 100),
    });

    logger.info(`Comentário adicionado: ${comment.id}`, 'communityService');
    return comment;
  }

  /**
   * Curte/descurte um post
   */
  async toggleLike(userId: string, postId: string): Promise<boolean> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    const index = post.likes.indexOf(userId);
    if (index >= 0) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(userId);
      
      // Criar atividade apenas ao curtir
      await this.createActivity({
        userId,
        username: '', // Será preenchido
        type: 'like',
        targetId: postId,
        targetType: 'post',
      });
    }

    await this.savePosts();
    return index < 0; // Retorna true se curtiu, false se descurtiu
  }

  /**
   * Compartilha um post
   */
  async sharePost(postId: string): Promise<boolean> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;

    post.shares++;
    await this.savePosts();
    return true;
  }

  /**
   * Cria um grupo
   */
  async createGroup(
    userId: string,
    group: Omit<Group, 'id' | 'members' | 'admins' | 'createdAt' | 'createdBy'>
  ): Promise<Group> {
    const newGroup: Group = {
      ...group,
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      members: [userId],
      admins: [userId],
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    this.groups.push(newGroup);
    await this.saveGroups();

    logger.info(`Grupo criado: ${newGroup.id}`, 'communityService');
    return newGroup;
  }

  /**
   * Entra em um grupo
   */
  async joinGroup(userId: string, groupId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await this.saveGroups();
    }

    return true;
  }

  /**
   * Sai de um grupo
   */
  async leaveGroup(userId: string, groupId: string): Promise<boolean> {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return false;

    const index = group.members.indexOf(userId);
    if (index >= 0) {
      group.members.splice(index, 1);
      await this.saveGroups();
    }

    return true;
  }

  /**
   * Segue um usuário
   */
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) return false;

    const existing = this.follows.find(
      f => f.followerId === followerId && f.followingId === followingId
    );

    if (existing) return false; // Já está seguindo

    const follow: Follow = {
      followerId,
      followingId,
      createdAt: new Date().toISOString(),
    };

    this.follows.push(follow);
    await this.saveFollows();

    // Criar atividade
    await this.createActivity({
      userId: followerId,
      username: '', // Será preenchido
      type: 'follow',
      targetId: followingId,
      targetType: 'user',
    });

    logger.info(`Usuário ${followerId} seguiu ${followingId}`, 'communityService');
    return true;
  }

  /**
   * Deixa de seguir um usuário
   */
  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const index = this.follows.findIndex(
      f => f.followerId === followerId && f.followingId === followingId
    );

    if (index >= 0) {
      this.follows.splice(index, 1);
      await this.saveFollows();
      return true;
    }

    return false;
  }

  /**
   * Obtém usuários seguidos
   */
  async getFollowing(userId: string): Promise<string[]> {
    return this.follows
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
  }

  /**
   * Obtém seguidores
   */
  async getFollowers(userId: string): Promise<string[]> {
    return this.follows
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
  }

  /**
   * Verifica se está seguindo
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return this.follows.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
  }

  /**
   * Busca posts
   */
  async searchPosts(query: string): Promise<Post[]> {
    const queryLower = query.toLowerCase();
    return this.posts.filter(
      post =>
        post.content.toLowerCase().includes(queryLower) ||
        post.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        post.username.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Obtém grupos públicos
   */
  async getPublicGroups(): Promise<Group[]> {
    return this.groups.filter(g => g.isPublic);
  }

  /**
   * Obtém grupos do usuário
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    return this.groups.filter(g => g.members.includes(userId));
  }

  /**
   * Cria atividade
   */
  private async createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<void> {
    const newActivity: Activity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    this.activities.unshift(newActivity);
    
    // Manter apenas últimas 1000 atividades
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000);
    }

    await this.saveActivities();
  }

  /**
   * Obtém atividades do feed
   */
  async getActivities(userId: string, limit: number = 50): Promise<Activity[]> {
    const following = await this.getFollowing(userId);
    const followingSet = new Set(following);
    followingSet.add(userId);

    return this.activities
      .filter(a => followingSet.has(a.userId))
      .slice(0, limit);
  }

  /**
   * Carrega dados
   */
  private async loadData(): Promise<void> {
    try {
      const [posts, groups, follows, activities] = await Promise.all([
        getAppSetting<Post[]>('community_posts').catch(() => []),
        getAppSetting<Group[]>('community_groups').catch(() => []),
        getAppSetting<Follow[]>('community_follows').catch(() => []),
        getAppSetting<Activity[]>('community_activities').catch(() => []),
      ]);

      this.posts = posts || [];
      this.groups = groups || [];
      this.follows = follows || [];
      this.activities = activities || [];
    } catch (error) {
      logger.warn('Erro ao carregar dados da comunidade', 'communityService', error);
    }
  }

  /**
   * Salva posts
   */
  private async savePosts(): Promise<void> {
    try {
      await saveAppSetting('community_posts', this.posts);
    } catch (error) {
      logger.error('Erro ao salvar posts', 'communityService', error);
    }
  }

  /**
   * Salva grupos
   */
  private async saveGroups(): Promise<void> {
    try {
      await saveAppSetting('community_groups', this.groups);
    } catch (error) {
      logger.error('Erro ao salvar grupos', 'communityService', error);
    }
  }

  /**
   * Salva follows
   */
  private async saveFollows(): Promise<void> {
    try {
      await saveAppSetting('community_follows', this.follows);
    } catch (error) {
      logger.error('Erro ao salvar follows', 'communityService', error);
    }
  }

  /**
   * Salva atividades
   */
  private async saveActivities(): Promise<void> {
    try {
      await saveAppSetting('community_activities', this.activities);
    } catch (error) {
      logger.error('Erro ao salvar atividades', 'communityService', error);
    }
  }
}

// Instância singleton
export const communityService = new CommunityService();

// Inicializar automaticamente
if (typeof window !== 'undefined') {
  communityService.initialize().catch(error => {
    logger.error('Erro ao inicializar serviço de comunidade', 'communityService', error);
  });
}

