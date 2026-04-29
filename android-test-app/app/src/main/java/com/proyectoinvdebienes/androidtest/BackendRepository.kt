package com.proyectoinvdebienes.androidtest

class BackendRepository(
    private val authApi: AuthApi,
    private val inventoryApi: InventoryApi
) {
    suspend fun login(username: String, password: String): AuthResponse {
        return authApi.login(LoginRequest(username, password))
    }

    suspend fun listAssets(): List<AssetDto> {
        return inventoryApi.getAssets()
    }

    companion object {
        fun create(): BackendRepository {
            return BackendRepository(
                authApi = BackendApiFactory.authApi,
                inventoryApi = BackendApiFactory.inventoryApi
            )
        }
    }
}
