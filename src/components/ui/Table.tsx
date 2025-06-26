import * as React from "react"
import { cn } from "@/lib/utils"
import type { TableProps, TableColumn } from "@/types"

interface TableRootProps extends React.HTMLAttributes<HTMLDivElement> {}

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  )
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// 데이터 테이블 컴포넌트
interface DataTableProps<T> extends TableProps<T> {
  containerClassName?: string
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onSort,
  sortBy,
  sortOrder,
  emptyMessage = "데이터가 없습니다.",
  className,
  containerClassName,
}: DataTableProps<T>) {
  const handleSort = (columnKey: string, sortable: boolean = true) => {
    if (!sortable || !onSort) return

    const newOrder = sortBy === columnKey && sortOrder === 'asc' ? 'desc' : 'asc'
    onSort(columnKey, newOrder)
  }

  const getSortIcon = (columnKey: string, sortable: boolean = true) => {
    if (!sortable) return null
    
    if (sortBy !== columnKey) {
      return <span className="ml-1 text-gray-400">↕️</span>
    }
    
    return (
      <span className="ml-1">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  const getValue = (item: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      // 중첩된 객체 접근 (예: "category.name")
      return key.split('.').reduce((obj, k) => obj?.[k], item)
    }
    return item[key as keyof T]
  }

  if (loading) {
    return (
      <div className={cn("table-container", containerClassName)}>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner w-8 h-8"></div>
          <span className="ml-2 text-gray-600">로딩 중...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("table-container", containerClassName)}>
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
                             <TableHead
                 key={`${String(column.key)}-${index}`}
                 className={cn(
                   column.className,
                   column.sortable && "cursor-pointer hover:bg-gray-100"
                 )}
                 onClick={() => handleSort(String(column.key), column.sortable)}
              >
                <div className="flex items-center">
                  {column.label}
                  {getSortIcon(String(column.key), column.sortable)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="text-center py-8 text-gray-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow key={item.id || index} className="table-row">
                                 {columns.map((column, colIndex) => (
                   <TableCell 
                     key={`${String(column.key)}-${colIndex}`}
                     className={cn("table-cell", column.className)}
                  >
                    {column.render 
                      ? column.render(getValue(item, column.key), item)
                      : getValue(item, column.key)
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  DataTable,
} 