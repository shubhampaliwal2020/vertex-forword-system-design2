'use client'

import { useState } from 'react'
import { ExternalLink, Play } from 'lucide-react'

function getEmbedUrl(videoUrl?: string) {
  if (!videoUrl) return null

  try {
    const url = new URL(videoUrl)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v')
        return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null
      }

      if (url.pathname.startsWith('/embed/')) return `https://www.youtube-nocookie.com${url.pathname}`
    }

    if (host === 'youtu.be') {
      const videoId = url.pathname.slice(1)
      return videoId ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}` : null
    }
  } catch {
    return null
  }

  return null
}

export function LessonPlayer({videoUrl, title}: {videoUrl?: string; title: string}) {
  const embedUrl = getEmbedUrl(videoUrl)

  if (!embedUrl) {
    return <div className="video-unavailable"><Play size={30} aria-hidden="true" /><strong>Video unavailable</strong><span>This lesson does not have a supported streaming video yet.</span></div>
  }

  return <div className="video-frame"><iframe src={`${embedUrl}?rel=0&modestbranding=1&playsinline=1`} title={`${title} lesson video`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>
}

export function LessonTabs({content, notes}: {content: React.ReactNode; notes: React.ReactNode}) {
  const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content')

  return <>
    <div className="tab-nav" role="tablist" aria-label="Lesson tabs">
      <button type="button" className={`tab ${activeTab === 'content' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'content'} onClick={() => setActiveTab('content')}>Lesson Content</button>
      <button type="button" className={`tab ${activeTab === 'notes' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>Notes</button>
    </div>
    <div className="lesson-content-panel">{activeTab === 'content' ? content : notes}</div>
  </>
}

export function ResourceLink({url, children}: {url?: string; children: React.ReactNode}) {
  if (!url) return <div className="resource-card">{children}</div>
  return <a className="resource-card" href={url} target="_blank" rel="noreferrer noopener">{children}<ExternalLink className="resource-link-icon" size={15} aria-hidden="true" /></a>
}