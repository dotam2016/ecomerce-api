// const casual = require('casual');
const fs = require('fs');
const axios = require('axios');
const queryString = require('query-string');
const uniqid = require('uniqid');

const axiosClient = axios.create({
  baseURL: 'https://mapi.sendo.vn/mob',
  headers: {
    'content-type': 'application/json',
  },
  paramsSerializer: (params) => queryString.stringify(params),
});

axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.log(error);
  }
);

const searchProducts = async (queryParams) => {
  const url = '/product/search';
  const response = await axiosClient.get(url, { params: queryParams });
  return response.data;
};

const getProductDetail = async (productId) => {
  const url = `/product/${productId}/detail/`;
  return await axiosClient.get(url);
};

// ---------------

// Random 50 posts data
// const posts = [];
// Array.from(new Array(50).keys()).map(() => {
//   const post = {
//     id: uniqid(),
//     title: casual.title,
//     author: casual.full_name,
//     description: casual.words(50),
//     createdAt: Date.now(),
//     updatedAt: Date.now(),
//     imageUrl: `https://picsum.photos/id/${casual.integer(1, 1000)}/1368/400`,
//   };

//   posts.push(post);
// });

const S3_IMAGE_URL = 'https://media3.scdn.vn';
const mapToProduct = (product) => {
  return {
    id: product.id,
    name: product.name,
    shortDescription: product.short_description,
    description: product.description,
    originalPrice: product.price,
    salePrice: product.final_price,
    isPromotion: product.is_promotion,
    promotionPercent: product.promotion_percent,
    images: product.images.map((url) => `${S3_IMAGE_URL}${url}`),
    isFreeShip: product.is_free_ship,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  };
};

const categoryList = [
  {
    id: uniqid(),
    name: 'SamSung',
    searchTerm: 'samsung',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
  {
    id: uniqid(),
    name: 'Apple',
    searchTerm: 'apple',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
  {
    id: uniqid(),
    name: 'Xiaomi',
    searchTerm: 'xiaomi',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
  {
    id: uniqid(),
    name: 'Oppo',
    searchTerm: 'oppo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
  {
    id: uniqid(),
    name: 'Cáp Sạc điện thoại',
    searchTerm: 'cap sac dien thoai',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
  {
    id: uniqid(),
    name: 'Pin dự phòng',
    searchTerm: 'pin du phong',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
  {
    id: uniqid(),
    name: 'Phụ kiện khác',
    searchTerm: 'op dien thoai, ',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isShow: true
  },
];
const productList = [];
const fetchProductList = async () => {
  // Loop through categories
  // Each cate, fetch list of product
  // Slide the first 20 items
  // Loop through each item and get detail
  // Then map to our product
  // Finally add to product list
  for (const category of categoryList) {
    const queryParams = {
      p: 1,
      q: category.searchTerm,
    };

    const productIdList = (await searchProducts(queryParams)).slice(0, 20).map((item) => item.id);
    for (const productId of productIdList) {
      const productData = await getProductDetail(productId);
      const transformedProduct = mapToProduct(productData);
      transformedProduct.categoryId = category.id;

      productList.push(transformedProduct);
    }
    console.log('Done adding category', category.name, productIdList.length);
  }
};


// --------------------
// --------------------
const main = async () => {
  await fetchProductList();

  // Setup db object
  const db = {
    categories: categoryList,
    products: productList,
  };

  // Save posts array to db.json file
  fs.writeFile('database/db.json', JSON.stringify(db), () => {
    console.log(`Generate done`);
  });
};
main();
