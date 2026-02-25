import { useEffect } from 'react'
import { authAPI, businessAPI } from '../utils/api'

function setFavicon(url) {
  // Remove all existing favicon tags to avoid caching issues
  const existingFavicons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']")
  existingFavicons.forEach(el => el.remove())

  // Create a fresh one with cache-bust timestamp
  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.href = `${url}?v=${Date.now()}`
  document.head.appendChild(link)
}

// For business dashboard — reads from auth token
export function useBusinessMeta() {
  useEffect(() => {
    const applyMeta = async () => {
      try {
        const response = await authAPI.getMe()
        const business = response.data.business

        if (business?.businessName) {
          document.title = business.businessName
        }

        if (business?.logo) {
          setFavicon(business.logo)
        }
      } catch (err) {
        // Not logged in or token expired — silently ignore
      }
    }

    applyMeta()
  }, [])
}

// For client-facing pages — reads by slug from public API
export function useClientBusinessMeta(businessSlug) {
  useEffect(() => {
    if (!businessSlug) return

    const applyMeta = async () => {
      try {
        const response = await businessAPI.getBySlug(businessSlug)
        const business = response.data.business

        if (business?.businessName) {
          document.title = business.businessName
        }

        if (business?.logo) {
          setFavicon(business.logo)
        }
      } catch (err) {
        // Business not found — silently ignore
      }
    }

    applyMeta()
  }, [businessSlug])
}