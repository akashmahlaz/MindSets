"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    Timestamp,
    updateDoc,
} from "firebase/firestore";
import {
    AlertTriangle,
    BookOpen,
    CheckCircle2,
    Clock,
    Edit,
    Eye,
    EyeOff,
    FileText,
    Filter,
    Heart,
    Image as ImageIcon,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Star,
    Trash2,
    TrendingUp,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STORY_CATEGORIES = [
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Depression" },
  { value: "stress", label: "Stress Management" },
  { value: "relationships", label: "Relationships" },
  { value: "self-care", label: "Self-Care" },
  { value: "mindfulness", label: "Mindfulness" },
  { value: "motivation", label: "Motivation" },
  { value: "wellness", label: "General Wellness" },
];

interface Story {
  id: string;
  title: string;
  content: string;
  summary?: string;
  category?: string;
  imageUrl?: string;
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
  isPublished: boolean;
  isFeatured: boolean;
  readTime?: number;
  likes?: number;
  views?: number;
  createdAt?: { toDate?: () => Date } | Date;
  updatedAt?: { toDate?: () => Date } | Date;
}

export default function StoriesManagement() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    featured: 0,
    totalViews: 0,
  });

  // Modal states
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [storyForm, setStoryForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "",
    imageUrl: "",
    isPublished: false,
    isFeatured: false,
    readTime: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Story[];
      setStories(data);

      // Calculate stats
      setStats({
        total: data.length,
        published: data.filter((s) => s.isPublished).length,
        drafts: data.filter((s) => !s.isPublished).length,
        featured: data.filter((s) => s.isFeatured).length,
        totalViews: data.reduce((acc, s) => acc + (s.views || 0), 0),
      });
    } catch (_error) {
      toast.error("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter((s) => {
    const matchesSearch =
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.authorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && s.isPublished) ||
      (statusFilter === "draft" && !s.isPublished);
    const matchesCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const resetForm = () => {
    setStoryForm({
      title: "",
      summary: "",
      content: "",
      category: "",
      imageUrl: "",
      isPublished: false,
      isFeatured: false,
      readTime: 5,
    });
  };

  const handleCreateStory = async () => {
    if (!storyForm.title || !storyForm.content) {
      toast.error("Title and content are required");
      return;
    }

    try {
      await addDoc(collection(db, "articles"), {
        ...storyForm,
        likes: 0,
        views: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      toast.success("Story created successfully");
      setCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (_error) {
      toast.error("Failed to create story");
    }
  };

  const handleEditStory = (story: Story) => {
    setSelectedStory(story);
    setStoryForm({
      title: story.title || "",
      summary: story.summary || "",
      content: story.content || "",
      category: story.category || "",
      imageUrl: story.imageUrl || "",
      isPublished: story.isPublished || false,
      isFeatured: story.isFeatured || false,
      readTime: story.readTime || 5,
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStory) return;

    try {
      const docRef = doc(db, "articles", selectedStory.id);
      await updateDoc(docRef, {
        ...storyForm,
        updatedAt: Timestamp.now(),
      });
      toast.success("Story updated successfully");
      setEditDialogOpen(false);
      loadData();
    } catch (_error) {
      toast.error("Failed to update story");
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStory) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "articles", selectedStory.id));
      setDeleteDialogOpen(false);
      setSelectedStory(null);
      toast.success("Story deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete story");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (story: Story) => {
    try {
      const docRef = doc(db, "articles", story.id);
      await updateDoc(docRef, {
        isPublished: !story.isPublished,
        updatedAt: Timestamp.now(),
      });
      toast.success(story.isPublished ? "Story unpublished" : "Story published");
      loadData();
    } catch (_error) {
      toast.error("Failed to update story");
    }
  };

  const handleToggleFeatured = async (story: Story) => {
    try {
      const docRef = doc(db, "articles", story.id);
      await updateDoc(docRef, {
        isFeatured: !story.isFeatured,
        updatedAt: Timestamp.now(),
      });
      toast.success(story.isFeatured ? "Removed from featured" : "Added to featured");
      loadData();
    } catch (_error) {
      toast.error("Failed to update story");
    }
  };

  const getCategoryBadge = (category?: string) => {
    const cat = STORY_CATEGORIES.find((c) => c.value === category);
    return (
      <Badge variant="outline" className="capitalize">
        {cat?.label || category || "Uncategorized"}
      </Badge>
    );
  };

  const getStatusBadge = (isPublished: boolean, isFeatured: boolean) => {
    if (isFeatured) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
          <Star className="w-3 h-3 fill-current" />
          Featured
        </Badge>
      );
    }
    if (isPublished) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Published
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="w-3 h-3" />
        Draft
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Stories</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Published</p>
                <p className="text-3xl font-bold text-gray-900">{stats.published}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Featured</p>
                <p className="text-3xl font-bold text-gray-900">{stats.featured}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Star className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Views</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stories Table Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                Stories & Articles
              </CardTitle>
              <CardDescription>
                Manage all stories, articles, and resources
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                  setCreateDialogOpen(true);
                }}
                size="sm"
                className="gap-2 bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="w-4 h-4" />
                New Story
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {STORY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <TabsList>
                <TabsTrigger value="all" className="gap-1">
                  <Filter className="w-3 h-3" />
                  All
                </TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="draft">Drafts</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Separator className="mb-4" />

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="w-[350px]">Story</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-500">
                        <BookOpen className="w-10 h-10 text-gray-300" />
                        <p>No stories found</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            resetForm();
                            setCreateDialogOpen(true);
                          }}
                        >
                          Create your first story
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStories.map((story) => (
                    <TableRow key={story.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {story.imageUrl ? (
                              <img
                                src={story.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-teal-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{story.title}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {story.summary || "No summary"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(story.category)}</TableCell>
                      <TableCell>
                        {getStatusBadge(story.isPublished, story.isFeatured)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {story.views || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {story.likes || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {formatDate(story.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStory(story);
                                setViewSheetOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditStory(story)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Story
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTogglePublish(story)}>
                              {story.isPublished ? (
                                <>
                                  <EyeOff className="w-4 h-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(story)}>
                              {story.isFeatured ? (
                                <>
                                  <X className="w-4 h-4 mr-2" />
                                  Remove Featured
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Make Featured
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedStory(story);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Story
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredStories.length} of {stories.length} stories
          </div>
        </CardContent>
      </Card>

      {/* View Story Sheet */}
      <Sheet open={viewSheetOpen} onOpenChange={setViewSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Story Details</SheetTitle>
            <SheetDescription>Full information about this story</SheetDescription>
          </SheetHeader>
          {selectedStory && (
            <div className="mt-6 space-y-6">
              {/* Cover Image */}
              <div className="w-full h-48 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center overflow-hidden">
                {selectedStory.imageUrl ? (
                  <img
                    src={selectedStory.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-16 h-16 text-teal-400" />
                )}
              </div>

              {/* Title & Badges */}
              <div>
                <h3 className="text-xl font-semibold mb-2">{selectedStory.title}</h3>
                <div className="flex gap-2 flex-wrap">
                  {getStatusBadge(selectedStory.isPublished, selectedStory.isFeatured)}
                  {getCategoryBadge(selectedStory.category)}
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedStory.readTime || 5} min read
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Summary */}
              {selectedStory.summary && (
                <div>
                  <Label className="text-gray-500 mb-2 block">Summary</Label>
                  <p className="text-gray-700">{selectedStory.summary}</p>
                </div>
              )}

              {/* Content Preview */}
              <div>
                <Label className="text-gray-500 mb-2 block">Content Preview</Label>
                <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                  <p className="text-gray-700 whitespace-pre-wrap text-sm">
                    {selectedStory.content}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Eye className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xl font-bold">{selectedStory.views || 0}</p>
                  <p className="text-xs text-gray-500">Views</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Heart className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xl font-bold">{selectedStory.likes || 0}</p>
                  <p className="text-xs text-gray-500">Likes</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-xl font-bold">{selectedStory.readTime || 5}</p>
                  <p className="text-xs text-gray-500">Min Read</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Created</Label>
                  <p className="font-medium">{formatDate(selectedStory.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Updated</Label>
                  <p className="font-medium">{formatDate(selectedStory.updatedAt)}</p>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setViewSheetOpen(false);
                    handleEditStory(selectedStory);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleTogglePublish(selectedStory);
                    setViewSheetOpen(false);
                  }}
                >
                  {selectedStory.isPublished ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Publish
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Create Story Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-teal-600" />
              Create New Story
            </DialogTitle>
            <DialogDescription>
              Add a new story or article to the platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={storyForm.title}
                onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                placeholder="Enter story title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={storyForm.category}
                  onValueChange={(v) => setStoryForm({ ...storyForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Read Time (minutes)</Label>
                <Input
                  type="number"
                  value={storyForm.readTime}
                  onChange={(e) =>
                    setStoryForm({ ...storyForm, readTime: parseInt(e.target.value) || 5 })
                  }
                  min={1}
                  max={60}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={storyForm.imageUrl}
                onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={storyForm.summary}
                onChange={(e) => setStoryForm({ ...storyForm, summary: e.target.value })}
                placeholder="Brief summary of the story..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={storyForm.content}
                onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                placeholder="Write your story content here..."
                rows={8}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publish immediately</Label>
                <p className="text-sm text-gray-500">Make visible to all users</p>
              </div>
              <Switch
                checked={storyForm.isPublished}
                onCheckedChange={(v) => setStoryForm({ ...storyForm, isPublished: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Featured story</Label>
                <p className="text-sm text-gray-500">Highlight on the homepage</p>
              </div>
              <Switch
                checked={storyForm.isFeatured}
                onCheckedChange={(v) => setStoryForm({ ...storyForm, isFeatured: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateStory} className="bg-teal-600 hover:bg-teal-700">
              Create Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Story Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Story</DialogTitle>
            <DialogDescription>Update story information and content</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={storyForm.title}
                onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                placeholder="Enter story title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={storyForm.category}
                  onValueChange={(v) => setStoryForm({ ...storyForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Read Time (minutes)</Label>
                <Input
                  type="number"
                  value={storyForm.readTime}
                  onChange={(e) =>
                    setStoryForm({ ...storyForm, readTime: parseInt(e.target.value) || 5 })
                  }
                  min={1}
                  max={60}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={storyForm.imageUrl}
                onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                value={storyForm.summary}
                onChange={(e) => setStoryForm({ ...storyForm, summary: e.target.value })}
                placeholder="Brief summary of the story..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea
                value={storyForm.content}
                onChange={(e) => setStoryForm({ ...storyForm, content: e.target.value })}
                placeholder="Write your story content here..."
                rows={8}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Published</Label>
                <p className="text-sm text-gray-500">Visible to all users</p>
              </div>
              <Switch
                checked={storyForm.isPublished}
                onCheckedChange={(v) => setStoryForm({ ...storyForm, isPublished: v })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Featured</Label>
                <p className="text-sm text-gray-500">Highlighted on homepage</p>
              </div>
              <Switch
                checked={storyForm.isFeatured}
                onCheckedChange={(v) => setStoryForm({ ...storyForm, isFeatured: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="bg-teal-600 hover:bg-teal-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Story Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Story
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this story? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedStory && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedStory.imageUrl ? (
                    <img
                      src={selectedStory.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileText className="w-5 h-5 text-teal-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{selectedStory.title}</p>
                  <p className="text-sm text-gray-500">
                    {selectedStory.views || 0} views • {selectedStory.likes || 0} likes
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteStory} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Story"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
