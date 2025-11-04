"use client";

import { useState, useRef } from "react";
import { Upload, Video, Trash2, Play, Download, Search, Clock, FileVideo } from "lucide-react";

interface VideoFile {
  id: string;
  name: string;
  size: number;
  duration: number;
  thumbnail: string;
  url: string;
  uploadDate: Date;
  tags: string[];
}

export default function Home() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Create object URL for video
      const videoUrl = URL.createObjectURL(file);

      // Generate thumbnail
      const thumbnail = await generateThumbnail(file);

      // Get video duration
      const duration = await getVideoDuration(videoUrl);

      const newVideo: VideoFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        duration: duration,
        thumbnail: thumbnail,
        url: videoUrl,
        uploadDate: new Date(),
        tags: extractTags(file.name),
      };

      setVideos(prev => [...prev, newVideo]);
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = Math.min(2, video.duration / 2);
      };

      video.onseeked = () => {
        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL());
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        resolve(video.duration);
        URL.revokeObjectURL(video.src);
      };
      video.src = url;
    });
  };

  const extractTags = (filename: string): string[] => {
    const name = filename.replace(/\.[^/.]+$/, "");
    const words = name.split(/[-_\s]+/).filter(w => w.length > 2);
    return words.slice(0, 3);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDelete = (id: string) => {
    const video = videos.find(v => v.id === id);
    if (video) {
      URL.revokeObjectURL(video.url);
      setVideos(prev => prev.filter(v => v.id !== id));
      if (selectedVideo?.id === id) {
        setSelectedVideo(null);
      }
    }
  };

  const filteredVideos = videos.filter(video =>
    video.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Video Manager Agent</h1>
          </div>
          <p className="text-purple-200">AI-powered video organization and management</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Search */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Videos
              </h2>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="video/*"
                multiple
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Choose Videos
                  </>
                )}
              </button>
            </div>

            {/* Search Section */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search
              </h2>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search videos..."
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
              <div className="space-y-2 text-white/80">
                <p>Total Videos: <span className="font-bold text-white">{videos.length}</span></p>
                <p>Total Size: <span className="font-bold text-white">
                  {formatFileSize(videos.reduce((acc, v) => acc + v.size, 0))}
                </span></p>
              </div>
            </div>
          </div>

          {/* Right Panel - Video Grid */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 min-h-[600px]">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <FileVideo className="w-5 h-5" />
                Your Videos ({filteredVideos.length})
              </h2>

              {filteredVideos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-white/60">
                  <Video className="w-16 h-16 mb-4" />
                  <p className="text-lg">No videos yet. Upload some to get started!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-purple-400 transition-all cursor-pointer"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <div className="relative aspect-video bg-black">
                        <img
                          src={video.thumbnail}
                          alt={video.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-medium truncate mb-2">{video.name}</h3>
                        <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
                          <Clock className="w-3 h-3" />
                          {video.uploadDate.toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {video.tags.map((tag, idx) => (
                            <span key={idx} className="bg-purple-600/40 text-purple-200 text-xs px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-sm">{formatFileSize(video.size)}</span>
                          <div className="flex gap-2">
                            <a
                              href={video.url}
                              download={video.name}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(video.id);
                              }}
                              className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        {selectedVideo && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="bg-slate-900 rounded-xl max-w-4xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-white font-semibold">{selectedVideo.name}</h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <video
                src={selectedVideo.url}
                controls
                autoPlay
                className="w-full aspect-video bg-black"
              />
              <div className="p-4 flex items-center justify-between">
                <div className="text-white/60 text-sm">
                  {formatFileSize(selectedVideo.size)} • {formatDuration(selectedVideo.duration)}
                </div>
                <a
                  href={selectedVideo.url}
                  download={selectedVideo.name}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
