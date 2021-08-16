import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RESTAURANT_PAGE_SIZE, CATEGORY_PAGE_SIZE } from "src/common/common.constants";
import { CoreOutput } from "src/common/dtos/output.dto";
import { User } from "src/users/entities/user.entity";
import { Repository, Raw } from "typeorm";
import { AllCategoriesOutput } from "./dtos/category/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/dish/create-dish.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/dish/delete-dish.dto";
import { EditDishInput, EditDishOutput } from "./dtos/dish/edit-dish.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/restaurant/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/restaurant/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/restaurant/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant/restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurant/restaurants.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/restaurant/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Dish } from "./entities/dish.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";


@Injectable()
export class RestaurantService {

    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private readonly categories: CategoryRepository,
        @InjectRepository(Dish)
        private readonly dishes: Repository<Dish>,
    ) { }

    async createRestaurant(
        owner: User,
        createRestaurantInput: CreateRestaurantInput,
    ): Promise<CreateRestaurantOutput> {
        try {
            const newRestaurant = this.restaurants.create(createRestaurantInput);

            newRestaurant.owner = owner;
            const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
            newRestaurant.category = category;

            await this.restaurants.save(newRestaurant);
            return {
                ok: true,
            };
        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: "Could not create restaurant"
            };
        }
    }

    async editRestaurant(
        owner: User,
        editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne(
                editRestaurantInput.restaurantId,
                { loadRelationIds: true },
            );
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                };
            }
            if (owner.id !== restaurant.ownerId) return {
                ok: false,
                error: "You can't edit a restaurant you don't own"
            };
            let category: Category = null;
            if (editRestaurantInput.categoryName) {
                category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
            }
            await this.restaurants.save([{
                id: editRestaurantInput.restaurantId,
                ...editRestaurantInput,
                ...(category && { category }), //if(category) return category
            }]);
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not edit restaurant',
            };
        }
    }

    async deleteRestaurant(owner: User, { restaurantId }: DeleteRestaurantInput): Promise<DeleteRestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne(restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                };
            }
            if (owner.id !== restaurant.ownerId) return {
                ok: false,
                error: "You can't delete a restaurant you don't own"
            };
            await this.restaurants.delete(restaurantId);
            return { ok: true };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not delete restaurant',
            };
        }
    }

    async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurants.findAndCount(
                {
                    take: RESTAURANT_PAGE_SIZE,
                    skip: (page - 1) * RESTAURANT_PAGE_SIZE,
                    order: {
                        isPromoted: 'DESC',
                    },
                    relations: ['category'],
                }
            )
            return {
                ok: true,
                results: restaurants,
                totalPages: Math.ceil(totalResults / RESTAURANT_PAGE_SIZE),
                totalResults,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not load restaurants',
            }
        }

    }

    async findRestaurantById({ restaurantId }: RestaurantInput): Promise<RestaurantOutput> {
        try {
            const restaurant = await this.restaurants.findOne(
                restaurantId,
                { relations: ['menu', 'category'] }
            );
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found',
                };
            }
            return {
                ok: true,
                restaurant,
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not find restaurant',
            };
        }
    }

    async searchRestaurantByName(
        { query, page }: SearchRestaurantInput
    ): Promise<SearchRestaurantOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurants.findAndCount({
                relations: ['category'],
                where: {
                    name: Raw(name => `${name} ILIKE '%${query}%'`),
                },
                take: RESTAURANT_PAGE_SIZE,
                skip: (page - 1) * RESTAURANT_PAGE_SIZE,
                order: {
                    isPromoted: 'DESC',
                },
            });
            console.log("aaaaaa",restaurants, totalResults);
            return {
                ok: true,
                totalPages: Math.ceil(totalResults / RESTAURANT_PAGE_SIZE),
                totalResults,
                restaurants
            }
        } catch (error) {
            return {
                ok: false,
                error: 'COuld not search for restaurants',
            };
        }
    }

    async myRestaurants(
        owner: User,
        { page }: RestaurantsInput
    ): Promise<RestaurantsOutput> {
        try {
            const [restaurants, totalResults] = await this.restaurants.findAndCount(
                {
                    where: {owner: owner},
                    take: RESTAURANT_PAGE_SIZE,
                    skip: (page - 1) * RESTAURANT_PAGE_SIZE,
                    order: {
                        isPromoted: 'DESC',
                    },
                    relations: ['category'],
                }
            )
            return {
                ok: true,
                results: restaurants,
                totalPages: Math.ceil(totalResults / RESTAURANT_PAGE_SIZE),
                totalResults,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not find restaurants.',
            }
        }

    }

    /**************** -- CATEGORY SERVICES -- ********************/

    async allCategories(): Promise<AllCategoriesOutput> {
        try {
            const categories = await this.categories.find();
            return {
                ok: true,
                categories
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not load categories',
            }
        }
    }

    countRestaurant(category: Category) {
        return this.restaurants.count({ category });
    }

    async findCategoryBySlug({ slug, page }: CategoryInput): Promise<CategoryOutput> {
        try {
            const category = await this.categories.findOne({ slug });
            if (!category) {
                return {
                    ok: false,
                    error: 'Category not found'
                };
            }
            const restaurants = await this.restaurants.find({
                where: { category },
                take: CATEGORY_PAGE_SIZE,
                skip: (page - 1) * CATEGORY_PAGE_SIZE,
                order: {
                    isPromoted: 'DESC',
                }
            });
            // category.restaurants = restaurants;
            const totalResults = await this.countRestaurant(category);
            return {
                ok: true,
                category,
                totalPages: Math.ceil(totalResults / CATEGORY_PAGE_SIZE),
                totalResults,
                restaurants
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not load Category'
            };
        }
    }


    /**************** -- DISH SERVICES -- ********************/

    async createDish(
        owner: User,
        createDishInput: CreateDishInput
    ): Promise<CreateDishOutput> {
        try {
            const restaurant = await this.restaurants.findOne(createDishInput.restaurantId);
            if (!restaurant) {
                return {
                    ok: false,
                    error: 'Restaurant not found'
                };
            }
            if (owner.id !== restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't do that." 
                };
            }
            await this.dishes.save(this.dishes.create(
                { 
                    ...createDishInput, 
                    restaurant
                }
            ));
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not create dish'
            }
        }
    }


    async editDish(
        owner: User,
        editDishInput: EditDishInput
    ): Promise<EditDishOutput> {
        try {
            const dish = await this.dishes.findOne(editDishInput.dishId,{relations:['restaurant']});
            if (!dish) {
                return {
                    ok: false,
                    error: 'Dish not found'
                };
            }
            if (owner.id !== dish.restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't do that." 
                };
            }
            await this.dishes.save([
                { 
                    id: editDishInput.dishId,
                    ...editDishInput,
                }
            ]);
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not edit dish'
            }
        }
    }


    async deleteDish(
        owner: User,
        {dishId}: DeleteDishInput
    ): Promise<DeleteDishOutput> {
        try {
            const dish = await this.dishes.findOne(dishId, {relations:['restaurant']});
            if (!dish) {
                return {
                    ok: false,
                    error: 'Dish not found'
                };
            }
            if (owner.id !== dish.restaurant.ownerId) {
                return {
                    ok: false,
                    error: "You can't do that." 
                };
            }  
            await this.dishes.delete(dishId);
            return {
                ok: true,
            }
        } catch (error) {
            return {
                ok: false,
                error: 'Could not delete dish'
            }
        }
    }

}