// tinkerbell.h - Chaotic Tinkerbell Map implementation
#pragma once
#include <cmath>

// Tinkerbell Map parameters
struct TinkerbellParams {
    double a;
    double b;
    double c;
    double d;
    
    // Default parameters that produce chaotic behavior
    TinkerbellParams() : a(0.9), b(-0.6), c(2.0), d(0.5) {}
    
    TinkerbellParams(double a_, double b_, double c_, double d_) 
        : a(a_), b(b_), c(c_), d(d_) {}
};

// Tinkerbell Map implementation
class TinkerbellMap {
private:
    TinkerbellParams params;
    double x, y;
    
public:
    TinkerbellMap(const TinkerbellParams& p = TinkerbellParams(), double x0 = 0.1, double y0 = 0.1) 
        : params(p), x(x0), y(y0) {}
    
    // Iterate the map once and return new point
    void iterate() {
        double x_next = x*x - y*y + params.a*x + params.b*y;
        double y_next = 2*x*y + params.c*x + params.d*y;
        x = x_next;
        y = y_next;
    }
    
    // Get current state
    double getX() const { return x; }
    double getY() const { return y; }
    
    // Reset to initial conditions
    void reset(double x0 = 0.1, double y0 = 0.1) {
        x = x0;
        y = y0;
    }
    
    // Generate sequence of points
    void generateSequence(double* x_values, double* y_values, int count) {
        for (int i = 0; i < count; i++) {
            x_values[i] = x;
            y_values[i] = y;
            iterate();
        }
    }
};