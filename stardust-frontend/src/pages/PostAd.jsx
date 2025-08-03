import { useForm } from "react-hook-form"
import { useState } from "react"

export default function PostAd() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const [submitError, setSubmitError] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const onSubmit = async (data) => {
    try {
      setSubmitError(null)
      setSubmitSuccess(false)

      const formData = new FormData()
      Object.keys(data).forEach((key) => {
        if (key === "images") {
          Array.from(data.images).forEach((file) => formData.append("images", file))
        } else {
          formData.append(key, data[key])
        }
      })

      const response = await fetch("/api/ads/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to post ad.")
      setSubmitSuccess(true)
    } catch (err) {
      setSubmitError(err.message)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-6">Post a New Ad</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        <input
          type="text"
          placeholder="Title"
          {...register("title", { required: true })}
          className="w-full border p-2 rounded"
        />
        {errors.title && <p className="text-red-500 text-sm">Title is required</p>}

        <textarea
          placeholder="Description"
          {...register("description", { required: true })}
          className="w-full border p-2 rounded"
        />
        {errors.description && <p className="text-red-500 text-sm">Description is required</p>}

        <input
          type="number"
          step="0.01"
          placeholder="Price"
          {...register("price", { required: true })}
          className="w-full border p-2 rounded"
        />
        {errors.price && <p className="text-red-500 text-sm">Price is required</p>}

        <select {...register("currency_code", { required: true })} className="w-full border p-2 rounded">
          <option value="">Select currency</option>
          <option value="ZAR">Rands (ZAR)</option>
          <option value="USD">Dollars (USD)</option>
          <option value="MWK">Kwacha (MWK)</option>
        </select>
        {errors.currency_code && <p className="text-red-500 text-sm">Currency is required</p>}

        <select {...register("ad_type", { required: true })} className="w-full border p-2 rounded">
          <option value="">Select ad type</option>
          <option value="for_sale">For Sale</option>
          <option value="for_rent">For Rent</option>
          <option value="wanted">Wanted</option>
        </select>
        {errors.ad_type && <p className="text-red-500 text-sm">Ad type is required</p>}

        <select {...register("contact_method", { required: true })} className="w-full border p-2 rounded">
          <option value="">Contact method</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="both">Phone & Email</option>
        </select>
        {errors.contact_method && <p className="text-red-500 text-sm">Contact method is required</p>}

        <input
          type="text"
          placeholder="City"
          {...register("city", { required: true })}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Province"
          {...register("province", { required: true })}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Country"
          {...register("country", { required: true })}
          className="w-full border p-2 rounded"
        />
        {(errors.city || errors.province || errors.country) && (
          <p className="text-red-500 text-sm">Complete location details are required</p>
        )}

        <input
          type="date"
          {...register("expires_at")}
          className="w-full border p-2 rounded"
        />

        <select {...register("subcategory", { required: true })} className="w-full border p-2 rounded">
          <option value="">Select Subcategory</option>
          {/* Replace with dynamic subcategory options */}
          <option value="1">Electronics</option>
          <option value="2">Vehicles</option>
        </select>

        <input
          type="file"
          multiple
          accept="image/jpeg, image/png"
          {...register("images")}
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Post Ad
        </button>

        {submitError && <p className="text-red-500 text-sm mt-2">{submitError}</p>}
        {submitSuccess && <p className="text-green-600 text-sm mt-2">Ad posted successfully!</p>}
      </form>
    </div>
  )
}
