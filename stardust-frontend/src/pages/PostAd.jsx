import { useForm } from "react-hook-form"
import { useState, useEffect } from "react"
import apiService from "../services/api"
import { useAuth } from "../context/AuthContext"

export default function PostAd() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()
  
  const { user } = useAuth()
  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [countries, setCountries] = useState([])
  const [locations, setLocations] = useState([])
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedProvince, setSelectedProvince] = useState("")

  // Fetch categories, countries, and locations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await apiService.getCategories()
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData)
        }
        
        // Fetch countries
        const countriesResponse = await apiService.getCountries()
        if (countriesResponse.ok) {
          const countriesData = await countriesResponse.json()
          setCountries(countriesData)
        }
        
        // Fetch full locations data for cascading
        const locationsResponse = await apiService.getLocations()
        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json()
          setLocations(locationsData)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }
    
    fetchData()
  }, [])

  // Update subcategories when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.id === parseInt(selectedCategory))
      if (category) {
        setSubcategories(category.subcategories || [])
      }
    } else {
      setSubcategories([])
    }
  }, [selectedCategory, categories])

  // Update provinces when country changes
  useEffect(() => {
    if (selectedCountry && locations.length > 0) {
      const countryData = locations.find(country => country.id === parseInt(selectedCountry))
      if (countryData) {
        setProvinces(countryData.provinces || [])
      } else {
        setProvinces([])
      }
      // Reset dependent selections
      setSelectedProvince("")
      setCities([])
    } else {
      setProvinces([])
      setSelectedProvince("")
      setCities([])
    }
  }, [selectedCountry, locations])

  // Update cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const province = provinces.find(prov => prov.id === parseInt(selectedProvince))
      if (province) {
        setCities(province.cities || [])
      }
    } else {
      setCities([])
    }
  }, [selectedProvince, provinces])

  const onSubmit = async (data) => {
    try {
      setSubmitError(null)
      setSubmitSuccess(false)

      // Prepare ad data
      const adData = {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        currency_code: data.currency_code,
        ad_type: data.ad_type,
        contact_method: data.contact_method,
        subcategory: parseInt(data.subcategory),
        country: parseInt(data.country),
        province: parseInt(data.province),
        city: parseInt(data.city),
        contact_visibility: "public", // Default value
      }

      // Create the ad
      const response = await apiService.createAd(adData)
      
      if (response.ok) {
        const result = await response.json()
        setSubmitSuccess(true)
        
        // Handle image uploads if any
        if (data.images && data.images.length > 0) {
          const adId = result.id
          await apiService.uploadMedia(data.images, adId)
        }
      } else {
        throw new Error("Failed to post ad.")
      }
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-6">Post a New Ad</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            placeholder="Enter ad title"
            {...register("title", { required: "Title is required" })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            placeholder="Enter ad description"
            {...register("description", { required: "Description is required" })}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
        </div>

        {/* Price and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("price", { required: "Price is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select 
              {...register("currency_code", { required: "Currency is required" })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select currency</option>
              <option value="ZAR">Rands (ZAR)</option>
              <option value="USD">Dollars (USD)</option>
              <option value="MWK">Kwacha (MWK)</option>
            </select>
            {errors.currency_code && <p className="mt-1 text-sm text-red-600">{errors.currency_code.message}</p>}
          </div>
        </div>

        {/* Ad Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ad Type</label>
          <select 
            {...register("ad_type", { required: "Ad type is required" })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select ad type</option>
            <option value="for_sale">For Sale</option>
            <option value="for_rent">For Rent</option>
            <option value="wanted">Wanted</option>
          </select>
          {errors.ad_type && <p className="mt-1 text-sm text-red-600">{errors.ad_type.message}</p>}
        </div>

        {/* Contact Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Method</label>
          <select 
            {...register("contact_method", { required: "Contact method is required" })} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Contact method</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="both">Phone & Email</option>
          </select>
          {errors.contact_method && <p className="mt-1 text-sm text-red-600">{errors.contact_method.message}</p>}
        </div>

        {/* Category and Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              {...register("category", { required: "Category is required" })} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
            <select 
              {...register("subcategory", { required: "Subcategory is required" })} 
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
            {errors.subcategory && <p className="mt-1 text-sm text-red-600">{errors.subcategory.message}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              {...register("country", { required: "Country is required" })}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              {...register("province", { required: "Province is required" })}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedCountry}
            >
              <option value="">Select Province</option>
              {provinces.map((province) => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </select>
            {errors.province && <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              {...register("city", { required: "City is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedProvince}
            >
              <option value="">Select City</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
          <input
            type="file"
            multiple
            accept="image/jpeg, image/png, image/webp"
            {...register("images")}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Select up to 10 images (max 5MB each)</p>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Post Ad
          </button>
        </div>

        {/* Error and Success Messages */}
        {submitError && <p className="mt-2 text-sm text-red-600 text-center">{submitError}</p>}
        {submitSuccess && <p className="mt-2 text-sm text-green-600 text-center">Ad posted successfully!</p>}
      </form>
    </div>
  )
}
