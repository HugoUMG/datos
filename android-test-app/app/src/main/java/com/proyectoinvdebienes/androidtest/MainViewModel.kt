package com.proyectoinvdebienes.androidtest

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch

class MainViewModel(
    private val repository: BackendRepository = BackendRepository.create()
) : ViewModel() {
    var loginState by mutableStateOf("Sin autenticar")
        private set
    var assetCount by mutableIntStateOf(0)
        private set
    var lastError by mutableStateOf<String?>(null)
        private set

    fun login(username: String, password: String) {
        viewModelScope.launch {
            runCatching {
                repository.login(username, password)
            }.onSuccess {
                loginState = "OK"
                lastError = null
            }.onFailure {
                loginState = "Falló"
                lastError = it.message
            }
        }
    }

    fun loadAssets() {
        viewModelScope.launch {
            runCatching {
                repository.listAssets()
            }.onSuccess {
                assetCount = it.size
                lastError = null
            }.onFailure {
                lastError = it.message
            }
        }
    }
}
