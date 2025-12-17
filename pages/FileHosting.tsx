import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, Input } from '../components/UI';
import { getHostedFiles, uploadHostedFile, deleteHostedFile, HostedFile } from '../services/mockData';
import { Upload, Trash2, Copy, FileCode, CheckCircle, ExternalLink, Loader2, ArrowLeft } from 'lucide-react';

export const FileHosting: React.FC = () => {
    const navigate = useNavigate();
    const [files, setFiles] = useState<HostedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        loadFiles();
    }, [navigate]);

    const loadFiles = async () => {
        setLoading(true);
        const data = await getHostedFiles();
        setFiles(data);
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation (Max 2MB for demo DB storage)
        if (file.size > 2 * 1024 * 1024) {
            alert("File is too large for database storage. Max 2MB.");
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const content = reader.result as string;
                await uploadHostedFile(file.name, file.type, content);
                await loadFiles();
            } catch (error) {
                console.error(error);
                alert("Failed to upload file");
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Are you sure? This will break any products using this preview link.")) {
            await deleteHostedFile(id);
            setFiles(prev => prev.filter(f => f.id !== id));
        }
    };

    const handleCopyLink = (id: string) => {
        const url = `${window.location.origin}/#/template-view/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                <Button variant="outline" onClick={() => navigate('/admin')} icon={ArrowLeft} className="mb-6">Back to Dashboard</Button>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <Badge color="purple">Admin Tool</Badge>
                        <h1 className="text-3xl font-bold text-[#E3E3E3] mt-2">Template Hosting</h1>
                        <p className="text-[#C4C7C5]">Upload HTML templates or single files to generate Preview URLs.</p>
                    </div>
                </div>

                <Card className="p-8 border-dashed border-2 border-[#444746] bg-[#1E1F20]/50 mb-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-[#131314] rounded-full flex items-center justify-center mb-4 border border-[#444746]">
                            {uploading ? <Loader2 className="w-8 h-8 animate-spin text-[#A8C7FA]" /> : <Upload className="w-8 h-8 text-[#A8C7FA]" />}
                        </div>
                        <h3 className="text-xl font-bold text-[#E3E3E3] mb-2">Upload New Template</h3>
                        <p className="text-[#8E918F] mb-6 max-w-md">
                            Select an HTML file (or image) to host. The system will generate a public URL you can use for product previews.
                        </p>
                        <label className="cursor-pointer">
                            <Button size="lg" disabled={uploading} onClick={() => document.getElementById('file-upload')?.click()}>
                                Select File
                            </Button>
                            <input 
                                id="file-upload" 
                                type="file" 
                                accept=".html,.htm,.png,.jpg,.jpeg" 
                                className="hidden" 
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </Card>

                <h3 className="text-xl font-bold text-[#E3E3E3] mb-4">Hosted Files ({files.length})</h3>
                
                {loading ? (
                     <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#A8C7FA]" /></div>
                ) : files.length === 0 ? (
                    <div className="text-center py-12 text-[#8E918F] bg-[#1E1F20] rounded-2xl border border-[#444746]">
                        No files uploaded yet.
                    </div>
                ) : (
                    <div className="bg-[#1E1F20] rounded-[24px] border border-[#444746] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-[#444746]">
                                <thead className="bg-[#131314]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">File Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden sm:table-cell">Type</th>
                                        <th className="px-6 py-4 text-left text-xs font-medium text-[#C4C7C5] uppercase tracking-wider hidden md:table-cell">Uploaded</th>
                                        <th className="px-6 py-4 text-right text-xs font-medium text-[#C4C7C5] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#1E1F20] divide-y divide-[#444746]">
                                    {files.map((file) => (
                                        <tr key={file.id} className="hover:bg-[#2D2E30] transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <FileCode className="w-5 h-5 text-[#A8C7FA]" />
                                                    <span className="text-sm font-medium text-[#E3E3E3]">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8E918F] hidden sm:table-cell">
                                                {file.mime_type}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#8E918F] hidden md:table-cell">
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => window.open(`/#/template-view/${file.id}`, '_blank')}
                                                        className="p-2 text-[#A8C7FA] hover:bg-[#A8C7FA]/10 rounded-full transition-colors"
                                                        title="Open Preview"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopyLink(file.id)}
                                                        className={`p-2 rounded-full transition-colors ${copiedId === file.id ? 'text-[#6DD58C] bg-[#0F5223]' : 'text-[#C4C7C5] hover:bg-[#444746]'}`}
                                                        title="Copy URL"
                                                    >
                                                        {copiedId === file.id ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(file.id)}
                                                        className="p-2 text-[#CF6679] hover:bg-[#CF6679]/10 rounded-full transition-colors"
                                                        title="Delete File"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};