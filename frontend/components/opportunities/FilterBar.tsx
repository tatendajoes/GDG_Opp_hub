'use client'

import { Button } from '@/components/ui/button'

type OpportunityType = 'internship' | 'full_time' | 'research' | 'fellowship' | 'scholarship'

interface FilterBarProps {
  readonly selectedTypes: OpportunityType[]
  readonly onFilterChange: (types: OpportunityType[]) => void
}

const filterOptions = [
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'research', label: 'Research' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'scholarship', label: 'Scholarship' },
] as const

export default function FilterBar({ selectedTypes, onFilterChange }: Readonly<FilterBarProps>) {
  const handleToggleFilter = (type: OpportunityType) => {
    if (selectedTypes.includes(type)) {
      // Remove the type from selection
      onFilterChange(selectedTypes.filter(t => t !== type))
    } else {
      // Add the type to selection
      onFilterChange([...selectedTypes, type])
    }
  }

  const handleClearFilters = () => {
    onFilterChange([])
  }

  const handleSelectAll = () => {
    onFilterChange(filterOptions.map(opt => opt.value as OpportunityType))
  }

  const isSelected = (type: OpportunityType) => selectedTypes.includes(type)
  const allSelected = selectedTypes.length === filterOptions.length
  const noneSelected = selectedTypes.length === 0

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Label */}
        <h3 className="text-sm font-semibold text-gray-700">
          Filter by Type {selectedTypes.length > 0 && `(${selectedTypes.length})`}:
        </h3>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* All Button */}
          <Button
            variant={allSelected || noneSelected ? 'default' : 'outline'}
            size="sm"
            onClick={noneSelected ? handleSelectAll : handleClearFilters}
            className={`
              transition-all duration-200
              ${allSelected || noneSelected
                ? 'shadow-md'
                : 'hover:border-purple-300'
              }
            `}
          >
            All
          </Button>

          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={isSelected(option.value as OpportunityType) ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleToggleFilter(option.value as OpportunityType)}
              className={`
                transition-all duration-200
                ${isSelected(option.value as OpportunityType)
                  ? 'shadow-md'
                  : 'hover:border-purple-300'
                }
              `}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Clear Filters */}
        {selectedTypes.length > 0 && !allSelected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-600 hover:text-purple-600"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}