import { SetMetadata } from "@nestjs/common";
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { AuthUser } from "src/auth/auth-user.decorator";
import { Role } from "src/auth/role.decorator";
import { CoreOutput } from "src/common/dtos/output.dto";
import { User, UserRole } from "src/users/entities/user.entity";
import { AllCategoriesOutput } from "./dtos/all-categories.dto";
import { CategoryInput, CategoryOutput } from "./dtos/category.dto";
import { CreateRestaurantInput, CreateRestaurantOutput } from "./dtos/create-restaurant.dto";
import { DeleteRestaurantInput, DeleteRestaurantOutput } from "./dtos/delete-restaurant.dto";
import { EditRestaurantInput, EditRestaurantOutput } from "./dtos/edit-restaurant.dto";
import { RestaurantsInput, RestaurantsOutput } from "./dtos/restaurants.dto";
import { Category } from "./entities/category.entity";
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
