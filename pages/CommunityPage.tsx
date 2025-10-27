import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { useUser } from '../context/UserContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { moderateContent } from '../services/geminiService';
import type { ForumPost } from '../types';
import { XIcon } from '../components/icons/XIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';


const mockPosts: ForumPost[] = [
    {
      id: '1',
      author: 'Ana P.',
      title: 'Quais são as melhores fontes de proteína vegetal?',
      content: 'Estou tentando reduzir o consumo de carne e queria saber quais vegetais ou leguminosas são ricos em proteína. Alguma sugestão de receita?',
      timestamp: '2 horas atrás',
      replies: [],
    },
    {
      id: '2',
      author: 'Carlos S.',
      title: 'Dica para lanche da tarde rápido e saudável',
      content: 'Descobri uma combinação ótima: iogurte grego com um punhado de nozes e um fio de mel. Mata a fome e dá energia!',
      timestamp: '5 horas atrás',
      replies: [],
    },
  ];

const CommunityPage: React.FC = () => {
    const { user, addPoints } = useUser();
    const [posts, setPosts] = useState<ForumPost[]>(mockPosts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostTitle.trim() || !newPostContent.trim()) {
            setError('Título e conteúdo são obrigatórios.');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const moderationResult = await moderateContent(`${newPostTitle}\n${newPostContent}`);
            
            if (moderationResult.is_safe) {
                const newPost: ForumPost = {
                    id: String(Date.now()),
                    author: user.nome,
                    title: newPostTitle,
                    content: newPostContent,
                    timestamp: 'Agora mesmo',
                    replies: [],
                };
                setPosts(prev => [newPost, ...prev]);
                addPoints(5);
                setIsModalOpen(false);
                setNewPostTitle('');
                setNewPostContent('');
            } else {
                setError(`Postagem bloqueada pela moderação: ${moderationResult.reason}`);
            }

        } catch (err) {
            console.error(err);
            setError("Ocorreu um erro ao verificar a postagem. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Comunidade</h1>
                    <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Troque dicas, receitas e experiências com outros usuários.</p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                    <Button onClick={() => setIsModalOpen(true)}>
                        Criar Nova Publicação
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {posts.map(post => (
                    <Card key={post.id}>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-primary-700 dark:text-primary-400">{post.title}</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Por {post.author} • {post.timestamp}</p>
                            <p className="mt-4 text-slate-600 dark:text-slate-300">{post.content}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" aria-modal="true">
                    <Card className="w-full max-w-2xl mx-4 animate-fade-in-up">
                        <form onSubmit={handleCreatePost}>
                             <div className="p-6 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                                <h2 className="text-xl font-bold">Nova Publicação</h2>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                                    <XIcon className="w-6 h-6 text-slate-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {error && <Alert type="error" title="Erro de Moderação">{error}</Alert>}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Título</label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={newPostTitle}
                                        onChange={e => setNewPostTitle(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="content" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Conteúdo</label>
                                    <textarea
                                        id="content"
                                        rows={5}
                                        value={newPostContent}
                                        onChange={e => setNewPostContent(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                            <div className="p-6 flex justify-end gap-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                                <Button type="submit" isLoading={isLoading}>
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    Publicar com IA
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;