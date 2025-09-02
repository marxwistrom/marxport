# Blog Content API

RESTful API for blog platform with content management, user authentication, commenting system, and search functionality. Includes admin dashboard.

## 🎯 Project Overview

This project demonstrates a comprehensive blog platform API built with Laravel, featuring advanced content management, user authentication, full-text search capabilities, and administrative tools. The system supports multi-author blogs with rich content features and performance optimization.

## 🛠 Technologies Used

- **Framework**: PHP Laravel
- **Database**: MySQL
- **Search Engine**: Elasticsearch
- **Cache**: Redis
- **Authentication**: Laravel Sanctum
- **Queue**: Laravel Queue with Redis
- **Storage**: Laravel Storage (local/S3)

## ✨ Key Features

### Content Management
- **Post Creation**: Rich text editor with media support
- **Category System**: Hierarchical post categorization
- **Tag Management**: Flexible tagging system
- **Draft System**: Save and publish workflow
- **Media Library**: Image and file management

### User System
- **Multi-role Authentication**: Admin, Editor, Author roles
- **User Profiles**: Customizable author profiles
- **Permission System**: Role-based content access
- **Social Login**: OAuth integration options

### Commenting System
- **Threaded Comments**: Nested comment discussions
- **Comment Moderation**: Approval workflow
- **Spam Protection**: Automated spam detection
- **User Interactions**: Like/dislike functionality

### Search & Discovery
- **Full-text Search**: Elasticsearch integration
- **Advanced Filtering**: Multi-criteria search
- **Related Posts**: Content recommendation
- **SEO Optimization**: Meta tags and sitemap generation

## 🏗 Architecture

### Laravel Structure
```
blog-api/
├── app/
│   ├── Http/Controllers/     # API controllers
│   ├── Models/              # Eloquent models
│   ├── Services/            # Business logic
│   ├── Repositories/        # Data access layer
│   └── Jobs/               # Background jobs
├── database/
│   ├── migrations/         # Database schema
│   └── seeders/           # Test data
├── routes/
│   └── api.php            # API routes
└── config/                # Configuration files
```

### Database Design
- **Posts**: Main content entity
- **Categories**: Hierarchical categorization
- **Tags**: Many-to-many tagging
- **Comments**: Threaded discussion system
- **Users**: Multi-role user management

## 🚀 Implementation Highlights

### Post Management API
```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Services\PostService;
use Illuminate\Http\Request;

class PostController extends Controller
{
    protected $postService;
    
    public function __construct(PostService $postService)
    {
        $this->postService = $postService;
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }
    
    public function index(Request $request)
    {
        $posts = $this->postService->getPaginatedPosts([
            'category' => $request->category,
            'tag' => $request->tag,
            'search' => $request->search,
            'author' => $request->author,
            'status' => 'published'
        ]);
        
        return PostResource::collection($posts);
    }
    
    public function store(StorePostRequest $request)
    {
        $this->authorize('create', Post::class);
        
        $post = $this->postService->createPost(
            $request->validated(),
            $request->user()
        );
        
        return new PostResource($post);
    }
    
    public function show(Post $post)
    {
        $this->authorize('view', $post);
        
        $post->load(['author', 'categories', 'tags', 'comments.user']);
        $post->increment('views');
        
        return new PostResource($post);
    }
}
```

### Elasticsearch Integration
```php
<?php

namespace App\Services;

use App\Models\Post;
use Elasticsearch\ClientBuilder;

class SearchService
{
    protected $client;
    
    public function __construct()
    {
        $this->client = ClientBuilder::create()
            ->setHosts([config('elasticsearch.host')])
            ->build();
    }
    
    public function indexPost(Post $post)
    {
        $params = [
            'index' => 'blog_posts',
            'id' => $post->id,
            'body' => [
                'title' => $post->title,
                'content' => strip_tags($post->content),
                'excerpt' => $post->excerpt,
                'author' => $post->author->name,
                'categories' => $post->categories->pluck('name')->toArray(),
                'tags' => $post->tags->pluck('name')->toArray(),
                'published_at' => $post->published_at?->toISOString(),
                'status' => $post->status
            ]
        ];
        
        return $this->client->index($params);
    }
    
    public function searchPosts($query, $filters = [])
    {
        $searchParams = [
            'index' => 'blog_posts',
            'body' => [
                'query' => [
                    'bool' => [
                        'must' => [
                            'multi_match' => [
                                'query' => $query,
                                'fields' => ['title^3', 'content', 'excerpt^2', 'tags^2']
                            ]
                        ],
                        'filter' => [
                            ['term' => ['status' => 'published']]
                        ]
                    ]
                ],
                'highlight' => [
                    'fields' => [
                        'title' => new \stdClass(),
                        'content' => ['fragment_size' => 150, 'number_of_fragments' => 3]
                    ]
                ],
                'sort' => [
                    '_score' => ['order' => 'desc'],
                    'published_at' => ['order' => 'desc']
                ]
            ]
        ];
        
        if (isset($filters['category'])) {
            $searchParams['body']['query']['bool']['filter'][] = [
                'term' => ['categories' => $filters['category']]
            ];
        }
        
        return $this->client->search($searchParams);
    }
}
```

### Comment System
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Comment extends Model
{
    protected $fillable = [
        'post_id', 'user_id', 'parent_id', 'content', 
        'status', 'user_name', 'user_email'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }
    
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')
                   ->where('status', 'approved')
                   ->orderBy('created_at', 'asc');
    }
    
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
    
    public function scopeThreaded($query)
    {
        return $query->whereNull('parent_id')
                    ->with(['replies.user', 'user'])
                    ->orderBy('created_at', 'desc');
    }
}
```

## 📊 Database Models

### Post Model
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Scout\Searchable;

class Post extends Model
{
    use Searchable;
    
    protected $fillable = [
        'title', 'slug', 'content', 'excerpt', 'featured_image',
        'status', 'published_at', 'meta_title', 'meta_description'
    ];
    
    protected $casts = [
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class);
    }
    
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }
    
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)
                   ->where('status', 'approved')
                   ->whereNull('parent_id')
                   ->orderBy('created_at', 'desc');
    }
    
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                    ->where('published_at', '<=', now());
    }
    
    public function getRouteKeyName()
    {
        return 'slug';
    }
}
```

## 📈 Advanced Features

### Content Scheduling
```php
<?php

namespace App\Jobs;

use App\Models\Post;
use App\Services\SearchService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class PublishScheduledPost implements ShouldQueue
{
    use InteractsWithQueue, Queueable;
    
    protected $post;
    
    public function __construct(Post $post)
    {
        $this->post = $post;
    }
    
    public function handle(SearchService $searchService)
    {
        if ($this->post->status === 'scheduled' && 
            $this->post->published_at <= now()) {
            
            $this->post->update(['status' => 'published']);
            
            // Index in Elasticsearch
            $searchService->indexPost($this->post);
            
            // Send notifications to subscribers
            // NotifySubscribers::dispatch($this->post);
        }
    }
}
```

### API Resource Transformation
```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'content' => $this->when($this->shouldShowFullContent($request), $this->content),
            'featured_image' => $this->featured_image,
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'views' => $this->views,
            'reading_time' => $this->reading_time,
            'author' => new UserResource($this->whenLoaded('author')),
            'categories' => CategoryResource::collection($this->whenLoaded('categories')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'comments_count' => $this->comments_count,
            'meta' => $this->when($request->routeIs('posts.show'), [
                'meta_title' => $this->meta_title,
                'meta_description' => $this->meta_description,
                'canonical_url' => route('posts.show', $this->slug)
            ]),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString()
        ];
    }
    
    private function shouldShowFullContent($request)
    {
        return $request->routeIs('posts.show') || 
               $request->user()?->can('view', $this->resource);
    }
}
```

## 🔒 Security Features

### API Rate Limiting
```php
// routes/api.php
Route::middleware(['throttle:api'])->group(function () {
    Route::apiResource('posts', PostController::class);
    Route::post('posts/{post}/comments', [CommentController::class, 'store'])
         ->middleware('throttle:comments');
});

// Custom rate limiter in RouteServiceProvider
RateLimiter::for('comments', function (Request $request) {
    return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
});
```

### Content Validation
```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize()
    {
        return $this->user()->can('create', Post::class);
    }
    
    public function rules()
    {
        return [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'status' => 'required|in:draft,published,scheduled',
            'published_at' => 'nullable|date|after:now',
            'categories' => 'array|exists:categories,id',
            'tags' => 'array|exists:tags,id',
            'featured_image' => 'nullable|image|max:2048'
        ];
    }
}
```

## 📚 Learning Outcomes

This project demonstrates:
- **Laravel Framework**: Advanced PHP framework usage
- **RESTful API Design**: Comprehensive API architecture
- **Elasticsearch Integration**: Full-text search implementation
- **Authentication & Authorization**: Multi-role access control
- **Database Relationships**: Complex Eloquent relationships
- **Queue System**: Background job processing
- **Content Management**: Rich content handling
- **Performance Optimization**: Caching and indexing strategies

## 🔗 Repository

**GitHub**: [Blog Content API](https://github.com/marxwistrom/blog-api)

---

*Part of Marx Wiström's Backend Development Portfolio*
