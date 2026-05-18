"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as SwipeIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type UserRoleItem = { roleId: number; role?: { name?: string } };

export type UserRow = {
  id: number;
  name?: string | null;
  username: string;
  email?: string | null;
  status: string;
  roles?: UserRoleItem[];
  createdAt: string;
  updatedAt: string;
};

interface UsersTableProps {
  columns: ColumnDef<UserRow, any>[];
  data: UserRow[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  isLoading?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  controlsPosition?: "top" | "bottom" | "both";
}

export function UsersTable({
  columns,
  data,
  searchTerm,
  onSearchChange,
  isLoading,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  controlsPosition = "bottom",
}: UsersTableProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    state: {
      pagination: {
        pageIndex: Math.max(0, page - 1),
        pageSize,
      },
    },
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const buildPageItems = (): (number | "...")[] => {
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: (number | "...")[] = [];
    const showLeft = page > 4;
    const showRight = page < totalPages - 3;
    const start = showLeft ? page - 1 : 1;
    const end = showRight ? page + 1 : totalPages;

    items.push(1);
    if (showLeft) items.push("...");
    for (let p = Math.max(2, start); p <= Math.min(totalPages - 1, end); p++) {
      items.push(p);
    }
    if (showRight) items.push("...");
    items.push(totalPages);
    return items;
  };

  const PaginationControls = () => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
      <div className="text-sm text-muted-foreground text-center sm:text-left">
        Trang {page} / {totalPages} • Tổng {total}
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Trước</span>
          </Button>
          <div className="hidden md:flex items-center gap-1">
            {buildPageItems().map((it, idx) =>
              it === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <Button
                  key={it}
                  variant={it === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange && onPageChange(it as number)}
                >
                  {it}
                </Button>
              )
            )}
          </div>
          <div className="md:hidden text-sm px-2 text-muted-foreground">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onPageChange && onPageChange(Math.min(totalPages, page + 1))
            }
            disabled={page >= totalPages}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Sau</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>
        <select
          className="w-full sm:w-auto bg-transparent border border-border rounded px-2 py-1 text-sm"
          value={pageSize}
          onChange={(e) => {
            console.log("Dropdown onChange called with:", e.target.value);
            onPageSizeChange && onPageSizeChange(Number(e.target.value));
          }}
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}/trang
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-foreground text-lg sm:text-xl">
            Danh sách Người dùng
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-muted/50 border-border"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {(controlsPosition === "top" || controlsPosition === "both") && (
          <PaginationControls />
        )}

        <div
          ref={scrollContainerRef}
          className="table-scroll-container -mx-2 sm:mx-0"
        >
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[800px]">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="border-border">
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as any;
                        return (
                          <TableHead
                            key={header.id}
                            className={`text-muted-foreground ${
                              meta?.className || ""
                            }`}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {isLoading
                    ? Array.from({ length: pageSize }).map((_, rIdx) => (
                        <TableRow
                          key={`skeleton-${rIdx}`}
                          className="border-border h-12"
                        >
                          {table.getAllLeafColumns().map((col, cIdx) => (
                            <TableCell key={`sk-${rIdx}-${col.id}`}>
                              {cIdx === 0 ? (
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-10 w-10 rounded-full" />
                                  <Skeleton className="h-4 w-32" />
                                </div>
                              ) : (
                                <Skeleton className="h-4 w-full" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="border-border">
                          {row.getVisibleCells().map((cell) => {
                            const meta = cell.column.columnDef.meta as any;
                            return (
                              <TableCell
                                key={cell.id}
                                className={meta?.className || ""}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
        </div>
        {(controlsPosition === "bottom" || controlsPosition === "both") && (
          <PaginationControls />
        )}
      </CardContent>
    </Card>
  );
}
