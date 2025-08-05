import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        <img 
          src={product.image} 
          alt={product.name}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/200x200?text=Product+Image';
          }}
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-details">
          <div className="price">₹{product.price}</div>
          <div className="rating">
            ⭐ {product.rating}/5 ({product.reviews} reviews)
          </div>
          <div className="category">🏷️ {product.category}</div>
          {product.color && (
            <div className="color">🎨 Color: {product.color}</div>
          )}
          {product.design && (
            <div className="design">🎯 Design: {product.design}</div>
          )}
          {product.material && (
            <div className="material">🧵 Material: {product.material}</div>
          )}
          {product.style && (
            <div className="style">👔 Style: {product.style}</div>
          )}
          <div className="stock">
            {product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
          </div>
          <div className="sizes">
            📏 Sizes: {product.variants.map(v => v.size).join(', ')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard; 