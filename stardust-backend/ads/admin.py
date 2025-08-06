from django.contrib import admin
from .models import Category, SubCategory, Country, Province, City, Ad, AdMedia

# Inline classes for better hierarchical editing
class SubCategoryInline(admin.TabularInline):
    model = SubCategory
    extra = 1
    prepopulated_fields = {'slug': ('name',)}
    fields = ['name', 'slug']

class ProvinceInline(admin.TabularInline):
    model = Province
    extra = 1
    fields = ['name']

class CityInline(admin.TabularInline):
    model = City
    extra = 1
    fields = ['name']

class AdMediaInline(admin.TabularInline):
    model = AdMedia
    extra = 1
    fields = ['file_url', 'media_type', 'is_thumbnail']
    readonly_fields = ['upload_date']

# Main admin classes
@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'currency_code', 'province_count']
    search_fields = ['name', 'code']
    list_filter = ['currency_code']
    inlines = [ProvinceInline]
    
    def province_count(self, obj):
        return obj.provinces.count()
    province_count.short_description = 'Provinces'

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'subcategory_count']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name']
    inlines = [SubCategoryInline]
    
    def subcategory_count(self, obj):
        return obj.subcategories.count()
    subcategory_count.short_description = 'Subcategories'

@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'slug', 'ad_count']
    list_filter = ['category']
    search_fields = ['name', 'category__name']
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['category']
    
    def ad_count(self, obj):
        return obj.ad_set.count()
    ad_count.short_description = 'Ads'

@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ['name', 'country', 'city_count']
    list_filter = ['country']
    search_fields = ['name', 'country__name']
    autocomplete_fields = ['country']
    inlines = [CityInline]
    
    def city_count(self, obj):
        return obj.cities.count()
    city_count.short_description = 'Cities'

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ['name', 'province', 'province_country', 'ad_count']
    list_filter = ['province__country', 'province']
    search_fields = ['name', 'province__name', 'province__country__name']
    autocomplete_fields = ['province']
    
    def province_country(self, obj):
        return f"{obj.province.country.name}"
    province_country.short_description = 'Country'
    
    def ad_count(self, obj):
        return obj.ad_set.count()
    ad_count.short_description = 'Ads'

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'author', 'subcategory', 'location_display',
        'price_display', 'status', 'ad_type', 'created_at'
    ]
    list_filter = [
        'status', 'ad_type', 'contact_method', 'subcategory__category',
        'country', 'province', 'created_at'
    ]
    search_fields = [
        'title', 'description', 'author__email', 'author__first_name',
        'author__last_name', 'subcategory__name', 'city__name'
    ]
    autocomplete_fields = ['author', 'subcategory', 'country', 'province', 'city']
    readonly_fields = ['views', 'inquiries', 'created_at', 'updated_at', 'is_expired']
    date_hierarchy = 'created_at'
    inlines = [AdMediaInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'author')
        }),
        ('Category & Location', {
            'fields': ('subcategory', 'country', 'province', 'city')
        }),
        ('Pricing', {
            'fields': ('price', 'currency_code', 'currency_symbol')
        }),
        ('Ad Settings', {
            'fields': ('ad_type', 'status', 'expires_at')
        }),
        ('Contact Information', {
            'fields': ('contact_visibility', 'contact_method', 'contact_phone', 'contact_email')
        }),
        ('Media', {
            'fields': ('thumbnail',)
        }),
        ('Statistics', {
            'fields': ('views', 'inquiries', 'created_at', 'updated_at', 'is_expired'),
            'classes': ('collapse',)
        })
    )
    
    def location_display(self, obj):
        return f"{obj.city.name}, {obj.province.name}, {obj.country.name}"
    location_display.short_description = 'Location'
    
    def price_display(self, obj):
        return f"{obj.currency_symbol}{obj.price}"
    price_display.short_description = 'Price'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'author', 'subcategory', 'subcategory__category', 'country', 'province', 'city'
        )

@admin.register(AdMedia)
class AdMediaAdmin(admin.ModelAdmin):
    list_display = ['ad_title', 'media_type', 'is_thumbnail', 'upload_date']
    list_filter = ['media_type', 'is_thumbnail', 'upload_date']
    search_fields = ['ad__title', 'ad__author__email']
    autocomplete_fields = ['ad']
    readonly_fields = ['upload_date']
    date_hierarchy = 'upload_date'
    
    def ad_title(self, obj):
        return obj.ad.title
    ad_title.short_description = 'Ad Title'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('ad', 'ad__author')

# Enable autocomplete for models that are referenced frequently
Category.search_fields = ['name']
SubCategory.search_fields = ['name', 'category__name']
Country.search_fields = ['name', 'code']
Province.search_fields = ['name', 'country__name']
City.search_fields = ['name', 'province__name']
