import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { User } from "src/users/entities/user.entity";
import { AllCategoriesOutput } from "./dtos/category/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category/category.dto";
import { CreateDishInput, CreateDishOutput } from "./dtos/dish/create-dish.dto";
import { DeleteDishInput, DeleteDishOutput } from "./dtos/dish/delete-dish.dto";
import { EditDishInput, EditDishOutput } from "./dtos/dish/edit-dish.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/restaurant/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/restaurant/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/restaurant/edit-restaurant.dto";
import { MyRestaurantsInput, MyRestaurantsOutput } from "./dtos/restaurant/my-restaurants";
import { RestaurantInput, RestaurantOutput } from "./dtos/restaurant/restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurant/restaurants.dto";
import { SearchRestaurantInput, SearchRestaurantOutput } from "./dtos/restaurant/search-restaurant.dto";
import { Category } from "./entities/category.entity";
import { Dish } from "./entities/dish.entity";
import { Restaurant } from "./entities/restaurant.entity";
import { RestaurantService } from "./restaurants.service";

@Resolver(of => Restaurant)
export class RestaurantResolver {

    constructor(private readonly restaurantService: RestaurantService) { }

    @Mutation(returns => CreateRestaurantOutput)
    // @SetMetadata("role", UserRole.Owner)
    @Role(['Owner'])
    async createRestaurant(
        @AuthUser() owner: User,
        @Args('input') createRestaurantInput: CreateRestaurantInput
    ): Promise<CreateRestaurantOutput> {
        return this.restaurantService.createRestaurant(
            owner,
            createRestaurantInput
        );
    }

    @Mutation(returns => EditRestaurantOutput)
    @Role(['Owner'])
    editRestaurant(
        @AuthUser() owner: User,
        @Args('input') editRestaurantInput: EditRestaurantInput
    ): Promise<EditRestaurantOutput> {
        return this.restaurantService.editRestaurant(
            owner,
            editRestaurantInput
        );
    }

    @Mutation(returns => DeleteRestaurantOutput)
    @Role(['Owner'])
    deleteRestaurant(
        @AuthUser() owner: User,
        @Args('input') deleteRestaurantInput: DeleteRestaurantInput
    ): Promise<DeleteRestaurantOutput> {
        return this.restaurantService.deleteRestaurant(
            owner,
            deleteRestaurantInput
        );
    }

    @Query(returns => RestaurantsOutput)
    restaurants(
        @Args('input') restaurantsInput: RestaurantsInput
    ): Promise<RestaurantsOutput> {
        return this.restaurantService.allRestaurants(restaurantsInput);
    }

    @Query(returns => RestaurantOutput)
    restaurant(
        @Args('input') restaurantInput: RestaurantInput
    ): Promise<RestaurantOutput> {
        return this.restaurantService.findRestaurantById(restaurantInput);
    }

    @Query(returns => MyRestaurantsOutput)
    @Role(['Owner'])
    myRestaurants(
        @AuthUser() owner: User,
        @Args('input') myRestaurantsInput: MyRestaurantsInput
    ): Promise<MyRestaurantsOutput> {
        return this.restaurantService.myRestaurants(owner, myRestaurantsInput);
    }

    @Query(returns => SearchRestaurantOutput)
    searchRestaurant(
        @Args('input') searchRestaurantInput: SearchRestaurantInput
    ): Promise<SearchRestaurantOutput> {
        return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
    }

}


/**************** -- CATEGORY RESOLVER -- ********************/

@Resolver(of => Category)
export class CategoryResolver {

    constructor(private readonly restaurantService: RestaurantService) { }

    @ResolveField(type => Int) // fields not in database
    restaurantCount(@Parent() category: Category): Promise<number> { //parent field
        console.log(category)
        return this.restaurantService.countRestaurant(category);
    }

    @Query(type => AllCategoriesOutput)
    allCategories(): Promise<AllCategoriesOutput> {
        return this.restaurantService.allCategories();
    }

    @Query(type => CategoryOutput)
    category(@Args('input') categoryInput: CategoryInput): Promise<CategoryOutput> {
        return this.restaurantService.findCategoryBySlug(categoryInput);
    }


}



/**************** -- DISH RESOLVER -- ********************/

@Resolver(of => Dish)
export class DishResolver {

    constructor(private readonly restaurantService: RestaurantService) { }

    @Mutation(type => CreateDishOutput)
    @Role(['Owner'])
    createDish(
        @AuthUser() owner: User,
        @Args('input') createDishInput: CreateDishInput
    ): Promise<CreateDishOutput> {
        return this.restaurantService.createDish(owner, createDishInput);
    }

    @Mutation(type => EditDishOutput)
    @Role(['Owner'])
    editDish(
        @AuthUser() owner: User,
        @Args('input') editDishInput: EditDishInput
    ): Promise<EditDishOutput> {
        return this.restaurantService.editDish(owner, editDishInput);
    }

    @Mutation(type => DeleteDishOutput)
    @Role(['Owner'])
    deleteDish(
        @AuthUser() owner: User,
        @Args('input') deleteDishInput: DeleteDishInput
    ): Promise<DeleteDishOutput> {
        return this.restaurantService.deleteDish(owner, deleteDishInput);
    }

}
