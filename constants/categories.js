// constants/categories.js
// รายการหมวดหมู่ส่วนกลาง เพื่อลดการซ้ำในหลายไฟล์

export const CATEGORIES = [
  { title: 'อาหารไทย', cuisine: 'thai', image: require('../assets/thai.jpg') },
  { title: 'อาหารฝรั่ง', cuisine: 'western', image: require('../assets/wentern.jpg') },
  { title: 'ของหวาน', cuisine: 'dessert', image: require('../assets/sweet.jpg') },
  { title: 'อาหารอีสาน', cuisine: 'isan', image: require('../assets/isan.webp') },
  { title: 'อาหารญี่ปุ่น', cuisine: 'japanese', image: require('../assets/japanes.jpg') },
  { title: 'อาหารเกาหลี', cuisine: 'korean', image: require('../assets/korea.jpg') },
  { title: 'อาหารจีน', cuisine: 'chinese', image: require('../assets/chinese.jpg') },
  { title: 'อาหารง่ายๆ', cuisine: 'easy', image: require('../assets/easyfood.webp') },
];

export default CATEGORIES;

