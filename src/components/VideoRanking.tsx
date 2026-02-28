"use client";

import { useState, useRef, useCallback } from "react";
import { Search, Loader2, PlaySquare, Heart, MessageCircle, Share2, Flame, Trophy, FileText, Copy, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TopNav from "./TopNav";

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  link: string;
  platform: string;
  channel: string;
  published: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  score: number;
}

interface CopyData {
  hook: string;
  body: string;
  cta: string;
  tags: string;
}

export default function VideoRanking() {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [loading, setLoading] = useState(false); 
  const [loadingMore, setLoadingMore] = useState(false); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedVideo, setSelectedVideo] = useState<VideoResult | null>(null);
  const [copyData, setCopyData] = useState<CopyData | null>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastVideoElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreVideos();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    setVideos([]); 
    setPage(1);
    setHasMore(true);
    
    try {
      const res = await fetch(`/api/videos?q=${encodeURIComponent(query)}&page=1`);
      const data = await res.json();
      
      // ✨ 核心优化：如果后端返回 401 错误，直接弹窗告知具体原因
      if (!res.ok) {
        alert(`❌ 抓取失败：\n${data.error || '未知网络错误'}`);
        return;
      }

      if (data.videos) {
        setVideos(data.videos);
        setHasMore(data.hasMore);
      }
    } catch (error: any) {
      console.error("搜索出错了:", error);
      alert("网络请求异常，请检查控制台日志！");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreVideos = async () => {
    if (loading || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const res = await fetch(`/api/videos?q=${encodeURIComponent(query)}&page=${nextPage}`);
      const data = await res.json();
      
      if (!res.ok) {
        alert(`加载下一页失败: ${data.error}`);
        setHasMore(false);
        return;
      }

      if (data.videos && data.videos.length > 0) {
        setVideos(prevVideos => [...prevVideos, ...data.videos]);
        setPage(nextPage);
        setHasMore(data.hasMore);
      } else {
        setHasMore(false); 
      }
    } catch (error) {
      console.error("加载更多失败:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
    return num.toLocaleString();
  };

  const getPlatformColor = (platform: string) => {
    switch(platform) {
      case '抖音': return 'bg-black text-white';
      case '小红书': return 'bg-red-500 text-white';
      case 'B站': return 'bg-pink-400 text-white';
      case '快手': return 'bg-orange-500 text-white';
      case '微博': return 'bg-yellow-500 text-white';
      default: return 'bg-stone-500 text-white';
    }
  };

  const handleExtractCopy = async (vid: VideoResult, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedVideo(vid);
    setCopyData(null);
    setIsGeneratingCopy(true);
    setIsCopied(false);

    try {
      const res = await fetch(`/api/copywrite?title=${encodeURIComponent(vid.title)}&platform=${encodeURIComponent(vid.platform)}`);
      const data = await res.json();
      setCopyData(data);
    } catch (error) {
      alert("获取文案失败，请稍后再试");
      setSelectedVideo(null);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const copyToClipboard = () => {
    if (!copyData) return;
    const fullText = `${copyData.hook}\n\n${copyData.body}\n\n${copyData.cta}\n\n${copyData.tags}`;
    navigator.clipboard.writeText(fullText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000); 
    });
  };

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center py-8 px-4 font-sans transition-all">
      <TopNav />

      <div className={`w-full max-w-4xl flex flex-col items-center transition-all duration-500 ease-in-out ${hasSearched ? 'mb-8 space-y-6' : 'mt-10 space-y-10'}`}>
        <div className="flex flex-col items-center space-y-3 text-center">
          <h1 className={`${hasSearched ? 'text-4xl' : 'text-5xl'} font-extrabold tracking-tight text-stone-900 flex items-center gap-4 drop-shadow-sm transition-all`}>
            <span>📊</span> 爆款视频榜
          </h1>
          {!hasSearched && <p className="text-stone-500 text-lg">输入竞品或行业关键词，挖掘高转化短视频并提取爆款文案</p>}
        </div>

        <form onSubmit={handleSearch} className="w-full flex gap-3 relative group">
          <Input
            type="text"
            placeholder="例如：钢瓶白酒营销、中国风酒瓶设计、抖音白酒带货..."
            className="h-14 pl-6 pr-4 text-lg rounded-2xl shadow-sm border-stone-200 focus-visible:ring-stone-400 bg-white"
            value={query} onChange={(e) => setQuery(e.target.value)} disabled={loading}
          />
          <Button type="submit" size="lg" className="h-14 px-8 rounded-2xl text-lg bg-red-600 hover:bg-red-700 text-white transition-colors" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
            {loading ? "分析中" : "生成榜单"}
          </Button>
        </form>
      </div>

      <div className="w-full max-w-4xl space-y-4">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-64 text-stone-400">
             <Loader2 className="h-10 w-10 animate-spin mb-4 text-red-500" />
             <p>正在拉取国内平台数据并计算热度...</p>
           </div>
        ) : videos.length > 0 ? (
          <div className="flex flex-col gap-4 pb-12">
            {videos.map((vid, index) => {
              const isLastElement = videos.length === index + 1;
              
              return (
                <div 
                  key={vid.id} 
                  ref={isLastElement ? lastVideoElementRef : null}
                  className="w-full"
                >
                  <Card onClick={() => window.open(vid.link, '_blank')} className="overflow-hidden group border border-stone-100 shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 rounded-2xl bg-white cursor-pointer">
                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
                      
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 text-stone-400 font-bold text-xl">
                        {index === 0 ? <div className="w-10 h-10 rounded-full bg-yellow-400 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-yellow-400/50"><Trophy className="w-5 h-5"/></div> :
                         index === 1 ? <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-300/50">2</div> :
                         index === 2 ? <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-amber-600/50">3</div> : 
                         index + 1}
                      </div>

                      <div className="relative w-full sm:w-64 h-36 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100 border border-stone-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={vid.thumbnail} alt={vid.title}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1616423640778-28d1b53229bd?auto=format&fit=crop&q=80&w=320&h=180'; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold backdrop-blur-md ${getPlatformColor(vid.platform)}`}>{vid.platform}</div>
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">{vid.duration}</div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-red-600/90 p-3 rounded-full text-white backdrop-blur-md transform scale-75 group-hover:scale-100 transition-transform"><PlaySquare className="w-6 h-6 ml-0.5" /></div>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col justify-between w-full h-full py-1">
                        <div>
                          <div className="flex justify-between items-start gap-4">
                            <h3 className="text-xl font-bold text-stone-900 line-clamp-2 group-hover:text-red-600 transition-colors flex-1">{vid.title}</h3>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => handleExtractCopy(vid, e)}
                              className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-lg shadow-sm"
                            >
                              <FileText className="w-4 h-4 mr-1.5" />
                              提取文案
                            </Button>
                          </div>
                          <p className="text-stone-500 text-sm mt-2 flex items-center gap-2">
                            <span className="font-medium text-stone-700">{vid.channel}</span>
                            <span>·</span><span>{vid.published}</span>
                            <span>·</span><span>{formatNumber(vid.views)} 次播放</span>
                          </p>
                        </div>

                        <div className="mt-4 flex items-center flex-wrap gap-4 sm:gap-6 text-sm text-stone-600">
                          <div className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-stone-400" /><span>{formatNumber(vid.likes)}</span></div>
                          <div className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-stone-400" /><span>{formatNumber(vid.comments)}</span></div>
                          <div className="flex items-center gap-1.5"><Share2 className="w-4 h-4 text-stone-400" /><span>{formatNumber(vid.shares)}</span></div>
                          <div className="flex-1" />
                          <div className="flex items-center gap-1.5 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-bold border border-orange-100">
                            <Flame className="w-4 h-4" /><span>热度得分: {formatNumber(vid.score)}</span>
                          </div>
                        </div>
                      </div>

                    </CardContent>
                  </Card>
                </div>
              );
            })}
            
            {loadingMore && (
              <div className="w-full flex justify-center items-center py-6 text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin text-red-400 mr-2" />
                <span className="text-sm">正在加载更多视频...</span>
              </div>
            )}
            
            {!hasMore && videos.length > 0 && (
              <div className="w-full text-center py-6 text-stone-400 text-sm relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-200"></div></div>
                <span className="relative bg-stone-50 px-4">到底啦，没有更多视频了</span>
              </div>
            )}
          </div>
        ) : hasSearched && !loading ? (
           <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-stone-200 rounded-2xl text-stone-400 bg-stone-50/50"><p className="text-lg">未找到相关视频，请换个关键词试试</p></div>
        ) : null}
      </div>

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-2xl w-full p-6 sm:p-8 bg-white border-stone-200 shadow-2xl rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-red-600" />
              爆款文案解构
            </DialogTitle>
            <p className="text-stone-500 text-sm mt-1 line-clamp-1">来源视频：{selectedVideo?.title}</p>
          </DialogHeader>
          
          <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 min-h-[300px] relative overflow-y-auto max-h-[60vh]">
            {isGeneratingCopy ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-stone-500 py-10">
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mb-4" />
                <p>正在利用 AI 深度拆解提取该视频文案模板...</p>
              </div>
            ) : copyData ? (
              <div className="space-y-6 text-stone-800 text-base leading-relaxed">
                <div>
                  <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded inline-block mb-2">🔥 黄金三秒 Hook</div>
                  <p className="font-medium text-stone-900">{copyData.hook}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block mb-2">📖 内容主体</div>
                  <p className="whitespace-pre-line">{copyData.body}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded inline-block mb-2">🗣️ 互动引导</div>
                  <p>{copyData.cta}</p>
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-600 bg-stone-200 px-2 py-1 rounded inline-block mb-2">🏷️ 热门标签</div>
                  <p className="text-blue-600 font-medium">{copyData.tags}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[250px]">
                <p className="text-center text-stone-500">无法提取内容</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelectedVideo(null)} className="h-12 px-6 rounded-xl text-stone-600 border-stone-200">
              关 闭
            </Button>
            <Button 
              onClick={copyToClipboard} 
              disabled={isGeneratingCopy || isCopied}
              className={`h-12 px-6 rounded-xl text-white font-medium transition-all ${isCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isCopied ? <CheckCircle className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
              {isCopied ? "复制成功，快去发布吧！" : "一键复制完整文案"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}