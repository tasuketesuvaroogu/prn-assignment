import { component$ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";

export default component$(() => {
  const location = useLocation();
  
  return (
    <header class="header">
      <div class="container">
        <nav>
          <h1>🛍️ Clothing Store</h1>
          <ul class="nav-links">
            <li>
              <Link 
                href="/" 
                class={location.url.pathname === "/" ? "active" : ""}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                href="/products/new" 
                class={location.url.pathname === "/products/new" ? "active" : ""}
              >
                Add Product
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
});
