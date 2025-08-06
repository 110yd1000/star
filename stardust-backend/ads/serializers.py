from rest_framework import serializers
from .models import Ad, Category, SubCategory, AdMedia, Country, Province, City
from django.utils import timezone
import re


class AdMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdMedia
        fields = ['id', 'file_url', 'media_type', 'is_thumbnail', 'upload_date']
        read_only_fields = ['upload_date']


class AdSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='subcategory.category.name', read_only=True)
    subcategory_id = serializers.PrimaryKeyRelatedField(queryset=SubCategory.objects.all(), source='subcategory')
    media = AdMediaSerializer(many=True, read_only=True)

    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'description', 'subcategory_id', 'category',
            'price', 'currency_symbol', 'currency_code',
            'ad_type', 'city', 'province',
            'contact_method', 'contact_visibility',
            'status', 'created_at', 'updated_at', 'expires_at',
            'media', 'views', 'inquiries'
        ]
        read_only_fields = ['created_at', 'updated_at', 'views', 'inquiries']

    def validate(self, data):
        user = self.context.get('request', {}).user if self.context.get('request') else None
        if user and not user.is_authenticated:
            raise serializers.ValidationError("Authentication required")
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
        ad = Ad.objects.create(**validated_data)
        return ad


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'slug']


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'subcategories']


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']


class ProvinceSerializer(serializers.ModelSerializer):
    cities = CitySerializer(many=True, read_only=True)
    
    class Meta:
        model = Province
        fields = ['id', 'name', 'cities']


class CountrySerializer(serializers.ModelSerializer):
    provinces = ProvinceSerializer(many=True, read_only=True)
    
    class Meta:
        model = Country
        fields = ['id', 'name', 'code', 'currency_code', 'provinces']


class AdCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ad
        fields = [
            'title', 'description', 'price', 'currency_code',
            'currency_symbol', 'subcategory', 'country', 'province', 'city',
            'ad_type', 'contact_visibility', 'contact_method',
            'contact_phone', 'contact_email'
        ]
        
    def validate_title(self, value):
        if len(value) < 5 or len(value) > 100:
            raise serializers.ValidationError("Title must be between 5-100 characters")
        return value
    
    def validate_description(self, value):
        if len(value) < 20 or len(value) > 2000:
            raise serializers.ValidationError("Description must be between 20-2000 characters")
        return value
    
    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price must be a positive number")
        return value
    
    def validate_contact_phone(self, value):
        if value and not re.match(r'^\+?[1-9]\d{1,14}$', value):
            raise serializers.ValidationError("Invalid phone number format")
        return value
        
    def validate(self, data):
        if data['contact_method'] in ['phone', 'both'] and not data.get('contact_phone'):
            raise serializers.ValidationError(
                {"contact_phone": "Phone number is required for this contact method"}
            )
        if data['contact_method'] in ['email', 'both'] and not data.get('contact_email'):
            raise serializers.ValidationError(
                {"contact_email": "Email is required for this contact method"}
            )
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['author'] = request.user
            validated_data['status'] = 'pending_approval'
        return Ad.objects.create(**validated_data)


class AdSummarySerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    
    class Meta:
        model = Ad
        fields = [
            'id', 'title', 'price', 'location', 'currency_code',
            'ad_type', 'thumbnail', 'created_at'
        ]
    
    def get_location(self, obj):
        return f"{obj.city.name}, {obj.province.name}"
    
    def get_price(self, obj):
        return f"{obj.currency_symbol} {obj.price:,.2f}"


class AdDetailSerializer(AdSummarySerializer):
    contact_info = serializers.SerializerMethodField()
    media = serializers.SerializerMethodField()
    is_expired = serializers.ReadOnlyField()
    author_id = serializers.ReadOnlyField()
    
    class Meta(AdSummarySerializer.Meta):
        fields = AdSummarySerializer.Meta.fields + [
            'description', 'author_id', 'contact_visibility',
            'contact_method', 'contact_info', 'is_expired',
            'updated_at', 'expires_at', 'media'
        ]
    
    def get_contact_info(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        
        if obj.contact_visibility == 'public':
            show_contact = True
        elif obj.contact_visibility == 'registered' and user and user.is_authenticated:
            show_contact = True
        else:
            show_contact = False
            
        if show_contact:
            return {
                'phone': obj.contact_phone if obj.contact_method in ['phone', 'both'] else None,
                'email': obj.contact_email if obj.contact_method in ['email', 'both'] else None
            }
        return None
    
    def get_media(self, obj):
        return [media.file_url for media in obj.media.all()]


class AdUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ad
        fields = [
            'title', 'description', 'price', 'contact_visibility',
            'contact_method', 'contact_phone', 'contact_email', 'ad_type'
        ]
    
    def validate_title(self, value):
        if value and (len(value) < 5 or len(value) > 100):
            raise serializers.ValidationError("Title must be between 5-100 characters")
        return value
    
    def validate_description(self, value):
        if value and (len(value) < 20 or len(value) > 2000):
            raise serializers.ValidationError("Description must be between 20-2000 characters")
        return value
    
    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Price must be a positive number")
        return value
    
    def validate_contact_phone(self, value):
        if value and not re.match(r'^\+?[1-9]\d{1,14}$', value):
            raise serializers.ValidationError("Invalid phone number format")
        return value


class UserAdSummarySerializer(AdSummarySerializer):
    status = serializers.CharField()
    views = serializers.IntegerField()
    inquiries = serializers.IntegerField()
    
    class Meta(AdSummarySerializer.Meta):
        fields = AdSummarySerializer.Meta.fields + ['status', 'views', 'inquiries']


class CountryWithProvincesSerializer(serializers.Serializer):
    country = serializers.CharField()
    provinces = ProvinceSerializer(many=True)


class CountryListSerializer(serializers.ModelSerializer):
    """Simplified Country serializer for dropdown lists"""
    class Meta:
        model = Country
        fields = ['id', 'name', 'code']


class PaginationInfoSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    limit = serializers.IntegerField()
    offset = serializers.IntegerField()
    has_next = serializers.BooleanField()
    has_previous = serializers.BooleanField()


class CategoryWithSubcategoriesSerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'subcategories']
