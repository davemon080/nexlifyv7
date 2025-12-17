import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFileContent } from '../services/mockData';
import { Loader2, AlertCircle } from 'lucide-react';

export const TemplateViewer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [content, setContent] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const file = await getFileContent(id);
                if (file) {
                    setContent(file.content);
                    setMimeType(file.mime_type);
                } else {
                    setError('File not found');
                }
            } catch (e) {
                setError('Failed to load template');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-gray-500" /></div>;
    
    if (error) return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold">{error}</h1>
        </div>
    );

    if (!content) return null;

    // Handle Images
    if (mimeType.startsWith('image/')) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-900">
                <img src={content} alt="Preview" className="max-w-full max-h-full object-contain" />
            </div>
        );
    }

    // Handle HTML
    // We assume content is a Data URL like "data:text/html;base64,..." or raw text if stored differently.
    // For this implementation, getFileContent returns the Data URI directly stored from FileReader.
    
    // We construct an iframe to render it safely
    return (
        <iframe 
            src={content} 
            title="Preview"
            className="w-screen h-screen border-none block"
            sandbox="allow-scripts allow-same-origin"
        />
    );
};