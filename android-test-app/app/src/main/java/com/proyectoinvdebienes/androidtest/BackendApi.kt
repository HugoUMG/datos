package com.proyectoinvdebienes.androidtest

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse
}

interface InventoryApi {
    @GET("api/inventory/assets")
    suspend fun getAssets(): List<AssetDto>
}

data class LoginRequest(val username: String, val password: String)
data class AuthResponse(val username: String, val role: String)
data class AssetDto(val id: Long, val code: String?, val name: String?)

object BackendApiFactory {
    private val logging = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BASIC
    }

    private val httpClient = OkHttpClient.Builder()
        .addInterceptor(logging)
        .build()

    private val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.BASE_URL)
        .client(httpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    val authApi: AuthApi = retrofit.create(AuthApi::class.java)
    val inventoryApi: InventoryApi = retrofit.create(InventoryApi::class.java)
}
