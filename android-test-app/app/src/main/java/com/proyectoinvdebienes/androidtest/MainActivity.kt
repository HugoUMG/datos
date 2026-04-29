package com.proyectoinvdebienes.androidtest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    val vm: MainViewModel = viewModel()
                    var username by remember { mutableStateOf("admin") }
                    var password by remember { mutableStateOf("admin123") }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text("Prueba rápida backend", style = MaterialTheme.typography.headlineSmall)
                        Text("Base URL: ${BuildConfig.BASE_URL}")

                        Button(onClick = { vm.login(username, password) }) {
                            Text("Login de prueba")
                        }

                        Button(onClick = { vm.loadAssets() }) {
                            Text("Cargar inventario")
                        }

                        Text("Estado login: ${vm.loginState}")
                        Text("Activos cargados: ${vm.assetCount}")
                        vm.lastError?.let { Text("Error: $it") }
                    }
                }
            }
        }
    }
}
