import { Property, NavigationItem } from '../types'
import { fetchApi, simulateDelay } from './baseApi'
import { mockProperties, mockNavigation } from '../mockData'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let propertiesCache: Property[] | null = null
let lastFetchTime = 0

const ensurePropertiesCache = async (): Promise<Property[]> => {
  const now = Date.now()
  if (!propertiesCache || now - lastFetchTime > CACHE_TTL) {
    propertiesCache = await propertyService.getAll()
    lastFetchTime = now
  }
  return propertiesCache
}

export const propertyService = {
  // Get all properties
  async getAll(tract?: string): Promise<Property[]> {
    const url = tract ? `/properties/?tract=${tract}` : '/properties/'
    const response = await fetchApi<{content: Property[]}>(url)
    return response.content
  },

  // Get property by ID
  async getById(id: string): Promise<Property> {
    const response = await fetchApi<{content: Property}>(`/properties/${id}/`)
    return response.content
  },

  // Get navigation tree
  async getNavigation(): Promise<NavigationItem[]> {
    // Get all areas
    const areas = await this.getAreas()
    
    // Build navigation tree
    const navigationItems: NavigationItem[] = await Promise.all(
      areas.map(async (area) => {
        // Get properties for this area
        const properties = await this.getProperties()
        const areaProperties = properties.filter(p => p.areaId === area.id)
        
        // Get buildings and staircases for each property
        const propertyItems = await Promise.all(
          areaProperties.map(async (property) => {
            const buildings = await this.getBuildings(property.id)
            
            const buildingItems = await Promise.all(
              buildings.map(async (building) => {
                const staircases = await this.getStaircases(building.id)
                
                return {
                  id: building.id,
                  name: building.name,
                  type: 'building' as const,
                  children: staircases.map(staircase => ({
                    id: staircase.id,
                    name: staircase.name,
                    type: 'staircase' as const,
                    children: []
                  }))
                }
              })
            )

            return {
              id: property.id,
              name: property.name,
              type: 'property' as const,
              children: buildingItems
            }
          })
        )

        return {
          id: area.id,
          name: area.name,
          type: 'area' as const,
          children: propertyItems
        }
      })
    )

    return navigationItems
  },

  // Create new property
  async create(data: Omit<Property, 'id'>): Promise<Property> {
    // TODO: Replace with actual API call
    return fetchApi<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update property
  async update(id: string, data: Partial<Property>): Promise<Property> {
    // TODO: Replace with actual API call
    return fetchApi<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete property
  async delete(id: string): Promise<void> {
    // TODO: Replace with actual API call
    return fetchApi<void>(`/properties/${id}`, {
      method: 'DELETE',
    })
  },
}
