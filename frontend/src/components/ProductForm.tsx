import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { ProductFormData, getProductById, createProduct, updateProduct, uploadImage } from '../utils/api';

const categories = ['T-Shirts', 'Jackets', 'Jeans', 'Dresses', 'Hoodies', 'Shoes', 'Shorts', 'Sweaters'];
const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '7', '8', '9', '10', '11', '12'];
const allColors = ['White', 'Black', 'Gray', 'Navy', 'Blue', 'Brown', 'Red', 'Green', 'Pink', 'Yellow', 'Purple', 'Orange'];

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id && id !== 'new';

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'T-Shirts',
    sizes: [],
    colors: [],
    stock: 0,
  });

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (isEditing) {
        try {
          const product = await getProductById(id);
          setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            sizes: product.sizes,
            colors: product.colors,
            stock: product.stock,
          });
          setSelectedSizes(product.sizes);
          setSelectedColors(product.colors);
          setImagePreview(product.image || '');
        } catch (error) {
          console.error('Error fetching product:', error);
          toast.error('Failed to load product');
        }
      }
    };

    fetchProduct();
  }, [id, isEditing]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!imageFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsUploading(true);
    try {
      // Call your backend API to upload the image
      const response = await uploadImage(imageFile);
      const imageUrl = response.path; // API returns { path: string }
      setFormData({ ...formData, image: imageUrl });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a product name');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a product description');
      return;
    }
    if (formData.price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (selectedSizes.length === 0) {
      toast.error('Please select at least one size');
      return;
    }
    if (selectedColors.length === 0) {
      toast.error('Please select at least one color');
      return;
    }
    if (!imagePreview) {
      toast.error('Please upload a product image');
      return;
    }

    const submitData: ProductFormData = {
      name: formData.name,
      description: formData.description,
      price: formData.price,
      image: formData.image || imagePreview,
      category: formData.category,
      sizes: selectedSizes,
      colors: selectedColors,
      stock: formData.stock,
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await updateProduct(id, submitData);
        toast.success('Product updated successfully');
      } else {
        await createProduct(submitData);
        toast.success('Product created successfully');
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Product' : 'Create New Product'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Classic White T-Shirt"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="0.00"
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sizes */}
              <div>
                <Label>Available Sizes *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allSizes.map((size) => (
                    <Badge
                      key={size}
                      variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                      {selectedSizes.includes(size) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <Label>Available Colors *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allColors.map((color) => (
                    <Badge
                      key={color}
                      variant={selectedColors.includes(color) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleColor(color)}
                    >
                      {color}
                      {selectedColors.includes(color) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image">Product Image *</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={!imageFile || isUploading}
                      variant="outline"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  {imagePreview && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="mb-2">Preview:</p>
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="max-w-sm max-h-64 object-contain mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-gray-500">
                    Max file size: 5MB. Supported formats: JPG, PNG, WebP
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
