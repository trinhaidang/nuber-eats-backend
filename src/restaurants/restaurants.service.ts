import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CoreOutput } from "src/common/dtos/output.dto";
import { User } from "src/users/entities/user.entity";
import { Repository, Like, Raw } from "typeorm";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/create-dish.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { CategoryRepository } from "./repositories/category.repository";


@Injectable()
export class RestaurantService {

    constructor(
        @InjectRepository(Restaurant)
        private readonly restaurants: Repository<Restaurant>,
        private readonly categories: CategoryRepository,
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

    async deleteRestaurant(owner: User, { restaurantId }: DeleteRestaurantInput): Promise<CoreOutput> {
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
                    take: 25,
                    skip: (page - 1) * 25,
                }
            )
            return {
                ok: true,
                results: restaurants,
                totalPages: Math.ceil(totalResults / 25),
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
                { relations: ['menu'] }
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
                where: {
                    name: Raw(name => `${name} ILIKE '%${query}%'`),
                },
                take: 25,
                skip: (page - 1) / 25,
            });
            return {
                ok: true,
                totalPages: Math.ceil(totalResults / 25),
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
                take: 25,
                skip: (page - 1) * 25,
            });
            category.restaurants = restaurants;
            const totalResults = await this.countRestaurant(category);
            return {
                ok: true,
                category,
                totalPages: Math.ceil(totalResults / 25)
            };
        } catch (error) {
            return {
                ok: false,
                error: 'Could not load Category'
            };
        }
    }


    /**************** -- DISH SERVICES -- ********************/

    async createDish(owner: User, createDishInput: CreateDishInput): Promise<CreateDishOutput>{
        try {
            return {
                ok: true,
            }
        }catch(error) {
            return {
                ok: false,
            }
        }
    }
}