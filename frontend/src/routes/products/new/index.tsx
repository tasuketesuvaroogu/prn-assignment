import { component$, useSignal, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import { productApi } from "~/services/productService";

export default component$(() => {
	const nav = useNavigate();

	const name = useSignal("");
	const description = useSignal("");
	const price = useSignal("");
	const image = useSignal("");
	const isUploading = useSignal(false);
	const isSaving = useSignal(false);
	const error = useSignal("");

	const handleImageUpload = $(async (e: Event) => {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		isUploading.value = true;
		error.value = "";

		try {
			const imageUrl = await productApi.uploadImage(file);
			image.value = imageUrl;
		} catch (err) {
			error.value = "Failed to upload image. Please try again.";
		} finally {
			isUploading.value = false;
		}
	});

	const handleSubmit = $(async (e: Event) => {
		e.preventDefault();

		if (!name.value || !description.value || !price.value) {
			error.value = "Please fill in all required fields";
			return;
		}

		isSaving.value = true;
		error.value = "";

		try {
			const product = await productApi.create({
				name: name.value,
				description: description.value,
				price: parseFloat(price.value),
				image: image.value || undefined,
			});

			// backend may return Id, id or _id depending on serializer; normalize
			const createdId = (product as any).id || (product as any).Id || (product as any)._id;
			if (createdId) {
				await nav(`/products/${createdId}`);
			} else {
				await nav(`/`);
			}
		} catch (err) {
			error.value = "Failed to create product. Please try again.";
			isSaving.value = false;
		}
	});

	return (
		<div class="container">
			<div class="form-container">
				<h2 style={{ marginBottom: "24px", fontSize: "24px", color: "#2c3e50" }}>
					Add New Product
				</h2>

				{error.value && <div class="error">{error.value}</div>}

				<form preventdefault:submit onSubmit$={handleSubmit}>
					<div class="form-group">
						<label for="name">Product Name *</label>
						<input
							type="text"
							id="name"
							placeholder="Enter product name"
							value={name.value}
							onInput$={(e) => (name.value = (e.target as HTMLInputElement).value)}
							required
						/>
					</div>

					<div class="form-group">
						<label for="description">Description *</label>
						<textarea
							id="description"
							placeholder="Enter product description"
							value={description.value}
							onInput$={(e) => (description.value = (e.target as HTMLTextAreaElement).value)}
							required
						/>
					</div>

					<div class="form-group">
						<label for="price">Price ($) *</label>
						<input
							type="number"
							id="price"
							step="0.01"
							min="0"
							placeholder="0.00"
							value={price.value}
							onInput$={(e) => (price.value = (e.target as HTMLInputElement).value)}
							required
						/>
					</div>

					<div class="form-group">
						<label>Product Image</label>
						<label for="image-input" class="image-upload">
							<input
								type="file"
								id="image-input"
								accept="image/*"
								onChange$={handleImageUpload}
								style={{ display: "none" }}
							/>
							<p>{isUploading.value ? "Uploading..." : "Click to upload image"}</p>
						</label>

						{image.value && (
							<div class="image-preview">
								<img src={image.value} alt="Preview" />
							</div>
						)}
					</div>

					<div class="btn-group">
						<button type="submit" class="btn btn-primary" disabled={isSaving.value || isUploading.value}>
							{isSaving.value ? "Creating..." : "Create Product"}
						</button>
						<a href="/" class="btn btn-secondary">
							Cancel
						</a>
					</div>
				</form>
			</div>
		</div>
	);
});
