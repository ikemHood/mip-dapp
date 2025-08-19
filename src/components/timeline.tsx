"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Button } from "@/src/components/ui/button"
import { AssetFilterDrawer, type FilterState } from "@/src/components/asset-filter-drawer"
import { ExpandableAssetCard } from "@/src/components/expandable-asset-card"
import { usePublicTimeline } from "@/src/hooks/use-public-timeline"
import {
  ExternalLink,
  Sparkles,
  Loader2,
} from "lucide-react"

const defaultFilters: FilterState = {
  search: "",
  assetTypes: [],
  licenses: [],
  verifiedOnly: false,
  dateRange: "all",
  sortBy: "recent",
  tags: [],
  priceRange: [0, 100],
}

const ASSETS_PER_PAGE = 10

export function Timeline() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [isPaging, setIsPaging] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Load real assets for public timeline
  const { assets, isLoading: isLoadingAssets, error } = usePublicTimeline()

  const filteredAssets = useMemo(() => {
    let filtered = [...assets]

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(
        (asset) =>
          asset.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          asset.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          asset.creator.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          asset.tags.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Asset type filter
    if (filters.assetTypes.length > 0) {
      filtered = filtered.filter((asset) => filters.assetTypes.includes(asset.type.toLowerCase()))
    }

    // License filter
    if (filters.licenses.length > 0) {
      filtered = filtered.filter((asset) => {
        const assetLicense = asset.licenseType.toLowerCase().replace(/\s+/g, "-")
        return filters.licenses.some((license) => assetLicense.includes(license) || license.includes(assetLicense))
      })
    }

    // Verified creators filter
    if (filters.verifiedOnly) {
      filtered = filtered.filter((asset) => asset.creator.verified)
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter((asset) =>
        filters.tags.some((tag) => asset.tags.toLowerCase().includes(tag.toLowerCase())),
      )
    }

    // Sort
    switch (filters.sortBy) {
      case "alphabetical":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "popular":
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        break
      case "trending":
        filtered.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime())
        break
      default:
        break
    }

    return filtered
  }, [assets, filters])

  const paginatedAssets = useMemo(() => {
    return filteredAssets.slice(0, currentPage * ASSETS_PER_PAGE)
  }, [filteredAssets, currentPage])

  const activeFilterCount = useMemo(() => {
    return [
      filters.search && 1,
      filters.assetTypes.length,
      filters.licenses.length,
      filters.verifiedOnly && 1,
      filters.dateRange !== "all" && 1,
      filters.sortBy !== "recent" && 1,
      filters.tags.length,
    ]
      .filter(Boolean)
      .reduce((a, b) => (a as number) + (b as number), 0)
  }, [filters])

  const loadMore = useCallback(async () => {
    if (isPaging || !hasMore) return
    setIsPaging(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    const nextPage = currentPage + 1
    const totalAvailable = filteredAssets.length
    const nextPageAssets = totalAvailable - currentPage * ASSETS_PER_PAGE
    if (nextPageAssets <= 0) {
      setHasMore(false)
    } else {
      setCurrentPage(nextPage)
    }
    setIsPaging(false)
  }, [currentPage, filteredAssets.length, isPaging, hasMore])

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadMore])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
    setHasMore(true)
  }, [filters])

  const clearFilters = () => {
    setFilters(defaultFilters)
  }

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case "search":
        setFilters((prev) => ({ ...prev, search: "" }))
        break
      case "assetType":
        setFilters((prev) => ({
          ...prev,
          assetTypes: prev.assetTypes.filter((t) => t !== value),
        }))
        break
      case "license":
        setFilters((prev) => ({
          ...prev,
          licenses: prev.licenses.filter((l) => l !== value),
        }))
        break
      case "verified":
        setFilters((prev) => ({ ...prev, verifiedOnly: false }))
        break
      case "tag":
        setFilters((prev) => ({
          ...prev,
          tags: prev.tags.filter((t) => t !== value),
        }))
        break
    }
  }

  const toggleExpanded = (assetId: string) => {
    setExpandedAssets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(assetId)) {
        newSet.delete(assetId)
      } else {
        newSet.add(assetId)
      }
      return newSet
    })
  }

  const handleShare = (asset: any) => {
    const url = `${window.location.origin}/asset/${asset.slug}`
    navigator.clipboard.writeText(url)
  }

  return (
    <div className="space-y-6">
     
     
      {/* Header */}
      <div className="text-center space-y-4">
        
      </div>
     

      {/* Error state */}
      {error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Unable to load assets</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isLoadingAssets ? "Loading assets..." : "No assets found"}
          </h3>
          {!isLoadingAssets && (
            <p className="text-muted-foreground mb-6">Try adjusting your filters to discover more IP assets</p>
          )}
          <Button onClick={clearFilters} variant="outline">
            <Sparkles className="w-4 h-4 mr-2" />
            Explore All Assets
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-6">
          {paginatedAssets.map((asset) => (
            <ExpandableAssetCard key={asset.id} asset={asset} variant="list" />
          ))}

          {/* Loading indicator */}
          {isPaging && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading more assets...</span>
              </div>
            </div>
          )}

          {/* End of results */}
          {!hasMore && paginatedAssets.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">That's all for today</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
