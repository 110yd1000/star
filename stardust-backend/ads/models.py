from django.db import models
from django.conf import settings
from django.utils import timezone

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    
    class Meta:
        verbose_name_plural = "categories"
    
    def __str__(self):
        return self.name

class SubCategory(models.Model):
    category = models.ForeignKey(Category, related_name='subcategories', on_delete=models.PROTECT)
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    
    class Meta:
        verbose_name_plural = "subcategories"
        unique_together = ['category', 'slug']
    
    def __str__(self):
        return f"{self.category.name} > {self.name}"

class Province(models.Model):
    name = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='South Africa')
    
    def __str__(self):
        return f"{self.name}, {self.country}"

class City(models.Model):
    province = models.ForeignKey(Province, related_name='cities', on_delete=models.PROTECT)
    name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name_plural = "cities"
    
    def __str__(self):
        return f"{self.name}, {self.province.name}"

class Ad(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('paused', 'Paused'),
        ('pending_approval', 'Pending Approval'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired')
    ]
    
    CONTACT_VISIBILITY_CHOICES = [
        ('by_request', 'By Request'),
        ('registered', 'Registered Users'),
        ('public', 'Public')
    ]
    
    CONTACT_METHOD_CHOICES = [
        ('phone', 'Phone Only'),
        ('email', 'Email Only'),
        ('both', 'Both')
    ]
    
    AD_TYPE_CHOICES = [
        ('for_sale', 'For Sale'),
        ('for_rent', 'For Rent'),
        ('wanted', 'Wanted')
    ]

    CURRENCY_CHOICES = [
        ('ZAR', 'R'),
        ('USD', '$'),
        ('MWK', 'MK')
    ]

    # Basic Info
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=2000)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency_code = models.CharField(
        max_length=3,
        choices=[(code, code) for code, symbol in CURRENCY_CHOICES],
        default='ZAR'
    )
    currency_symbol = models.CharField(
        max_length=5,
        choices=[(symbol, symbol) for code, symbol in CURRENCY_CHOICES],
        default='R'
    )

    # Categories and Location
    subcategory = models.ForeignKey(SubCategory, on_delete=models.PROTECT)
    province = models.ForeignKey(Province, on_delete=models.PROTECT)
    city = models.ForeignKey(City, on_delete=models.PROTECT)
    
    # Ad Details
    ad_type = models.CharField(max_length=10, choices=AD_TYPE_CHOICES, default='for_sale')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_approval')
    
    # Contact Information
    contact_visibility = models.CharField(max_length=20, choices=CONTACT_VISIBILITY_CHOICES)
    contact_method = models.CharField(
        max_length=5,
        choices=CONTACT_METHOD_CHOICES,
        default='both'  # Adding default value
    )
    contact_phone = models.CharField(max_length=15, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    
    # Metrics
    views = models.PositiveIntegerField(default=0)
    inquiries = models.PositiveIntegerField(default=0)
    
    # Media
    thumbnail = models.URLField(blank=True, null=True)
    
    # Relations
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['subcategory']),
            models.Index(fields=['city']),
            models.Index(fields=['price']),
            models.Index(fields=['author'])
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)
    
    @property
    def is_expired(self):
        """Check if the ad has expired"""
        return timezone.now() > self.expires_at
    
    @property
    def author_id(self):
        """Return author ID for API compatibility"""
        return self.author.id
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"

class AdMedia(models.Model):
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video')
    ]

    ad = models.ForeignKey(
        Ad, 
        on_delete=models.CASCADE,
        related_name='media'
    )
    file_url = models.URLField(
        help_text="URL to the media file"
    )
    media_type = models.CharField(
        max_length=5,
        choices=MEDIA_TYPES,
        default='image'
    )
    is_thumbnail = models.BooleanField(default=False)
    upload_date = models.DateTimeField(
        auto_now_add=True,
        db_index=True
    )

    class Meta:
        verbose_name_plural = "Ad media"
        ordering = ['-upload_date']
        indexes = [
            models.Index(fields=['ad', 'media_type']),
            models.Index(fields=['ad', 'is_thumbnail'])
        ]

    def __str__(self):
        return f"{self.ad.title} - {self.get_media_type_display()}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if not self.file_url:
            raise ValidationError({'file_url': 'Media file URL is required'})
