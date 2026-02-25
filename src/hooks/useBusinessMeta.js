import { useEffect } from 'react'
import { authAPI } from '../utils/api'

export function useBusinessMeta() {
  useEffect(() => {
    const applyMeta = async () => {
      try {
        const response = await authAPI.getMe()
        const business = response.data.business

        // Set page title
        if (business?.businessName) {
          document.title = business.businessName
        }

        // Set favicon
        if (business?.logo) {
          const favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']")
          if (favicon) {
            favicon.href = business.logo
          } else {
            const newFavicon = document.createElement('link')
            newFavicon.rel = 'icon'
            newFavicon.href = business.logo
            document.head.appendChild(newFavicon)
          }
        }
      } catch (err) {
        // Not logged in or token expired — silently ignore
      }
    }

    applyMeta()
  }, [])
}