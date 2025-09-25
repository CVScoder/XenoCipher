// example_usage.cpp - Demonstration of transposition with chaotic Tinkerbell maps

#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <cstring>
#include "transposition.h"

// Helper function to print a grid of data
void printGrid(const uint8_t* data, size_t rows, size_t cols, const std::string& label) {
    std::cout << "=== " << label << " (" << rows << "x" << cols << ") ===" << std::endl;
    for (size_t r = 0; r < rows; ++r) {
        for (size_t c = 0; c < cols; ++c) {
            std::cout << std::setw(3) << static_cast<int>(data[r * cols + c]) << " ";
        }
        std::cout << std::endl;
    }
    std::cout << std::endl;
}

// Example 1: Basic transposition of a numeric grid
void example1_numericGrid() {
    std::cout << "\n--- EXAMPLE 1: NUMERIC GRID TRANSPOSITION ---\n" << std::endl;
    
    // Create a simple 8x8 grid with sequential numbers
    const size_t rows = 8;
    const size_t cols = 8;
    std::vector<uint8_t> data(rows * cols);
    
    // Fill with sequential numbers 1-64
    for (size_t i = 0; i < rows * cols; ++i) {
        data[i] = static_cast<uint8_t>((i % 255) + 1);
    }
    
    // Define grid specification
    GridSpec grid = {rows, cols};
    
    // Define a key
    uint8_t key[8] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF};
    
    // Print original grid
    printGrid(data.data(), rows, cols, "Original Grid");
    
    // Apply forward transposition
    applyTransposition(data.data(), grid, key, PermuteMode::Forward);
    
    // Print transposed grid
    printGrid(data.data(), rows, cols, "Transposed Grid");
    
    // Apply inverse transposition to recover original
    applyTransposition(data.data(), grid, key, PermuteMode::Inverse);
    
    // Print recovered grid
    printGrid(data.data(), rows, cols, "Recovered Grid");
}

// Example 2: Text transposition
void example2_textTransposition() {
    std::cout << "\n--- EXAMPLE 2: TEXT TRANSPOSITION ---\n" << std::endl;
    
    // Sample text
    const char* text = "This is a demonstration of transposition using chaotic Tinkerbell maps. "
                       "The algorithm rearranges data in a secure and invertible manner.";
    
    // Calculate dimensions for a roughly square grid
    size_t textLen = strlen(text);
    size_t rows = static_cast<size_t>(sqrt(textLen));
    size_t cols = (textLen + rows - 1) / rows;  // Ceiling division
    
    // Create data buffer with padding
    std::vector<uint8_t> data(rows * cols, ' ');  // Pad with spaces
    
    // Copy text into buffer
    for (size_t i = 0; i < textLen; ++i) {
        data[i] = static_cast<uint8_t>(text[i]);
    }
    
    // Define grid specification
    GridSpec grid = {rows, cols};
    
    // Define a key
    uint8_t key[8] = {0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0};
    
    // Print original text
    std::cout << "Original Text: " << text << std::endl << std::endl;
    
    // Apply forward transposition
    applyTransposition(data.data(), grid, key, PermuteMode::Forward);
    
    // Print transposed text (as hex since it may contain non-printable chars)
    std::cout << "Transposed Text (hex): " << std::endl;
    for (size_t i = 0; i < data.size(); ++i) {
        std::cout << std::hex << std::setw(2) << std::setfill('0') 
                  << static_cast<int>(data[i]) << " ";
        if ((i + 1) % 16 == 0) std::cout << std::endl;
    }
    std::cout << std::dec << std::endl << std::endl;
    
    // Apply inverse transposition to recover original
    applyTransposition(data.data(), grid, key, PermuteMode::Inverse);
    
    // Print recovered text
    std::cout << "Recovered Text: " << std::endl;
    for (size_t i = 0; i < data.size(); ++i) {
        std::cout << static_cast<char>(data[i]);
    }
    std::cout << std::endl << std::endl;
}

// Example 3: Demonstrating sensitivity to key changes
void example3_keySensitivity() {
    std::cout << "\n--- EXAMPLE 3: KEY SENSITIVITY ---\n" << std::endl;
    
    // Create a simple 6x6 grid with sequential numbers
    const size_t rows = 6;
    const size_t cols = 6;
    std::vector<uint8_t> data(rows * cols);
    std::vector<uint8_t> data2(rows * cols);
    
    // Fill with sequential numbers
    for (size_t i = 0; i < rows * cols; ++i) {
        data[i] = data2[i] = static_cast<uint8_t>((i % 255) + 1);
    }
    
    // Define grid specification
    GridSpec grid = {rows, cols};
    
    // Define two keys that differ by only one bit
    uint8_t key1[8] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF};
    uint8_t key2[8] = {0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEE};  // Last byte differs
    
    std::cout << "Original data is identical for both keys." << std::endl;
    
    // Apply transposition with first key
    applyTransposition(data.data(), grid, key1, PermuteMode::Forward);
    
    // Apply transposition with second key
    applyTransposition(data2.data(), grid, key2, PermuteMode::Forward);
    
    // Print both transposed grids
    printGrid(data.data(), rows, cols, "Transposed with Key 1");
    printGrid(data2.data(), rows, cols, "Transposed with Key 2");
    
    // Calculate and print difference
    int diffCount = 0;
    for (size_t i = 0; i < rows * cols; ++i) {
        if (data[i] != data2[i]) diffCount++;
    }
    
    double diffPercentage = (static_cast<double>(diffCount) / (rows * cols)) * 100.0;
    std::cout << "Difference: " << diffCount << " out of " << (rows * cols) 
              << " elements (" << diffPercentage << "%)" << std::endl;
    std::cout << "This demonstrates the high sensitivity to key changes." << std::endl;
}

int main() {
    std::cout << "TRANSPOSITION WITH CHAOTIC TINKERBELL MAPS - EXAMPLES" << std::endl;
    std::cout << "=====================================================" << std::endl;
    
    example1_numericGrid();
    example2_textTransposition();
    example3_keySensitivity();
    
    return 0;
}