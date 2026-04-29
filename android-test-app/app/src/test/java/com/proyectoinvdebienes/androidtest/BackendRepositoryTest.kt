package com.proyectoinvdebienes.androidtest

import org.junit.Assert.assertEquals
import org.junit.Test

class BackendRepositoryTest {
    @Test
    fun loginRequest_hasExpectedData() {
        val req = LoginRequest(username = "admin", password = "1234")
        assertEquals("admin", req.username)
        assertEquals("1234", req.password)
    }
}
