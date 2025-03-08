import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderStatusUpdate.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.address.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.variantOption.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();

  // Create users
  console.log('Creating users...');
  
  // Using plain passwords for simplicity in development
  const adminPassword = 'Admin123!';  // In production, use proper hashing
  const userPassword = 'User123!';    // In production, use proper hashing
  
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      emailVerified: new Date(),
      role: 'ADMIN',
      profile: {
        create: {
          bio: 'Store administrator',
          phone: '123-456-7890'
        }
      },
      addresses: {
        create: {
          street: '123 Admin Street',
          city: 'Admin City',
          state: 'Admin State',
          postalCode: '12345',
          country: 'USA',
          isDefault: true
        }
      }
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Regular User',
      email: 'user@example.com',
      password: userPassword,
      emailVerified: new Date(),
      role: 'USER',
      profile: {
        create: {
          bio: 'Regular customer',
          phone: '098-765-4321'
        }
      },
      addresses: {
        create: {
          street: '456 User Street',
          city: 'User City',
          state: 'User State',
          postalCode: '54321',
          country: 'USA',
          isDefault: true
        }
      }
    }
  });

  // Create categories
  console.log('Creating categories...');
  
  const tshirtsCategory = await prisma.category.create({
    data: {
      name: 'T-shirts',
      description: 'Comfortable and stylish t-shirts for all occasions',
      slug: 't-shirts'
    }
  });

  const jeansCategory = await prisma.category.create({
    data: {
      name: 'Jeans',
      description: 'Durable denim jeans in various styles and fits',
      slug: 'jeans'
    }
  });

  const shoesCategory = await prisma.category.create({
    data: {
      name: 'Shoes',
      description: 'Footwear for all seasons and activities',
      slug: 'shoes'
    }
  });

  // Create products
  console.log('Creating products...');

  // T-shirts (Category 1) - 2 products
  const tshirt1 = await prisma.product.create({
    data: {
      name: 'Classic White T-Shirt',
      description: 'A timeless white t-shirt made from 100% organic cotton. Perfect for casual wear or layering.',
      price: 24.99,
      compareAtPrice: 29.99,
      sku: 'TS-001',
      inventory: 50,
      categoryId: tshirtsCategory.id,
      images: {
        create: [
          {
            url: '/images/p11-1.jpg',
            alt: 'Classic White T-Shirt - Front',
            position: 0
          },
          {
            url: '/images/p11-2.jpg',
            alt: 'Classic White T-Shirt - Back',
            position: 1
          }
        ]
      },
      variants: {
        create: [
          {
            name: 'Small White',
            sku: 'TS-001-S',
            price: 24.99,
            inventory: 15,
            options: {
              create: [
                {
                  name: 'Size',
                  value: 'S'
                },
                {
                  name: 'Color',
                  value: 'White'
                }
              ]
            }
          },
          {
            name: 'Medium White',
            sku: 'TS-001-M',
            price: 24.99,
            inventory: 20,
            options: {
              create: [
                {
                  name: 'Size',
                  value: 'M'
                },
                {
                  name: 'Color',
                  value: 'White'
                }
              ]
            }
          },
          {
            name: 'Large White',
            sku: 'TS-001-L',
            price: 24.99,
            inventory: 15,
            options: {
              create: [
                {
                  name: 'Size',
                  value: 'L'
                },
                {
                  name: 'Color',
                  value: 'White'
                }
              ]
            }
          }
        ]
      }
    }
  });

  const tshirt2 = await prisma.product.create({
    data: {
      name: 'Graphic Print T-Shirt',
      description: 'A stylish t-shirt featuring a modern graphic print. Made from soft cotton blend.',
      price: 29.99,
      sku: 'TS-002',
      inventory: 35,
      categoryId: tshirtsCategory.id,
      images: {
        create: [
          {
            url: '/images/p12-1.jpg',
            alt: 'Graphic Print T-Shirt - Front',
            position: 0
          },
          {
            url: '/images/p12-2.jpg',
            alt: 'Graphic Print T-Shirt - Back',
            position: 1
          }
        ]
      },
      variants: {
        create: [
          {
            name: 'Small Black',
            sku: 'TS-002-S',
            price: 29.99,
            inventory: 10,
            options: {
              create: [
                {
                  name: 'Size',
                  value: 'S'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          },
          {
            name: 'Medium Black',
            sku: 'TS-002-M',
            price: 29.99,
            inventory: 15,
            options: {
              create: [
                {
                  name: 'Size',
                  value: 'M'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          },
          {
            name: 'Large Black',
            sku: 'TS-002-L',
            price: 29.99,
            inventory: 10,
            options: {
              create: [
                {
                  name: 'Size',
                  value: 'L'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Jeans (Category 2) - 1 product
  const jeans = await prisma.product.create({
    data: {
      name: 'Slim Fit Denim Jeans',
      description: 'Premium quality slim fit jeans with a modern design. Perfect for casual and semi-formal occasions.',
      price: 59.99,
      sku: 'JN-001',
      inventory: 30,
      categoryId: jeansCategory.id,
      images: {
        create: [
          {
            url: '/images/p21-1.jpg',
            alt: 'Slim Fit Denim Jeans - Front',
            position: 0
          },
          {
            url: '/images/p21-2.jpg',
            alt: 'Slim Fit Denim Jeans - Back',
            position: 1
          }
        ]
      },
      variants: {
        create: [
          {
            name: '30/32 Blue',
            sku: 'JN-001-30-32',
            price: 59.99,
            inventory: 10,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '30/32'
                },
                {
                  name: 'Color',
                  value: 'Blue'
                }
              ]
            }
          },
          {
            name: '32/32 Blue',
            sku: 'JN-001-32-32',
            price: 59.99,
            inventory: 10,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '32/32'
                },
                {
                  name: 'Color',
                  value: 'Blue'
                }
              ]
            }
          },
          {
            name: '34/32 Blue',
            sku: 'JN-001-34-32',
            price: 59.99,
            inventory: 10,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '34/32'
                },
                {
                  name: 'Color',
                  value: 'Blue'
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Shoes (Category 3) - 1 product
  const shoes = await prisma.product.create({
    data: {
      name: 'Classic Leather Sneakers',
      description: 'Comfortable leather sneakers with a classic design. Perfect for everyday wear.',
      price: 89.99,
      sku: 'SH-001',
      inventory: 25,
      categoryId: shoesCategory.id,
      images: {
        create: [
          {
            url: '/images/p31-1.jpg',
            alt: 'Classic Leather Sneakers - Side View',
            position: 0
          },
          {
            url: '/images/p31-2.jpg',
            alt: 'Classic Leather Sneakers - Top View',
            position: 1
          }
        ]
      },
      variants: {
        create: [
          {
            name: 'Size 8 Black',
            sku: 'SH-001-8',
            price: 89.99,
            inventory: 5,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '8'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          },
          {
            name: 'Size 9 Black',
            sku: 'SH-001-9',
            price: 89.99,
            inventory: 8,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '9'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          },
          {
            name: 'Size 10 Black',
            sku: 'SH-001-10',
            price: 89.99,
            inventory: 7,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '10'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          },
          {
            name: 'Size 11 Black',
            sku: 'SH-001-11',
            price: 89.99,
            inventory: 5,
            options: {
              create: [
                {
                  name: 'Size',
                  value: '11'
                },
                {
                  name: 'Color',
                  value: 'Black'
                }
              ]
            }
          }
        ]
      }
    }
  });

  // Create a review for one of the products
  await prisma.review.create({
    data: {
      rating: 5,
      title: 'Perfect fit!',
      content: 'I love this t-shirt. The material is soft and comfortable, and it fits perfectly.',
      isPublished: true,
      userId: customer.id,
      productId: tshirt1.id
    }
  });

  // Create a cart for the customer
  const cart = await prisma.cart.create({
    data: {
      userId: customer.id
    }
  });

  // Add an item to the cart
  await prisma.cartItem.create({
    data: {
      quantity: 1,
      cartId: cart.id,
      productId: tshirt1.id,
      productVariantId: (await prisma.productVariant.findFirst({
        where: {
          productId: tshirt1.id,
          name: 'Medium White'
        }
      }))?.id
    }
  });

  // Add a product to the wishlist
  await prisma.wishlistItem.create({
    data: {
      userId: customer.id,
      productId: shoes.id
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 