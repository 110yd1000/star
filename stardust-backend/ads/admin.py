from django.contrib import admin
from .models import Category, SubCategory, Ad, AdMedia

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'slug']
    list_filter = ['category']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'price', 'status', 'created_at']
    list_filter = ['status', 'ad_type', 'contact_method']
    search_fields = ['title', 'description']
    raw_id_fields = ['author']
    date_hierarchy = 'created_at'

@admin.register(AdMedia)
class AdMediaAdmin(admin.ModelAdmin):
    list_display = ['ad', 'media_type', 'is_thumbnail', 'upload_date']
    list_filter = ['media_type', 'is_thumbnail']
    search_fields = ['ad__title']
    raw_id_fields = ['ad']
    date_hierarchy = 'upload_date'
