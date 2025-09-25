import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap

# Tinkerbell map parameters
a = 0.9
b = -0.6
c = 2.0
d = 0.5

def tinkerbell_map(x, y):
    """Compute one iteration of the Tinkerbell map."""
    x_next = x*x - y*y + a*x + b*y
    y_next = 2*x*y + c*x + d*y
    return x_next, y_next

# Generate points
def generate_trajectory(x0, y0, n_iterations):
    """Generate a trajectory of the Tinkerbell map."""
    x, y = x0, y0
    trajectory = np.zeros((n_iterations, 2))
    
    for i in range(n_iterations):
        x, y = tinkerbell_map(x, y)
        trajectory[i] = [x, y]
    
    return trajectory

# Create colorful visualization
def create_tinkerbell_visualization(n_iterations=100000, x0=0.1, y0=0.1):
    """Create a visualization of the Tinkerbell map."""
    trajectory = generate_trajectory(x0, y0, n_iterations)
    
    # Create a custom colormap for the trajectory
    colors = [(0, 0, 0.8), (0, 0.8, 0), (0.8, 0, 0)]  # Blue -> Green -> Red
    cmap = LinearSegmentedColormap.from_list('tinkerbell', colors, N=n_iterations)
    
    plt.figure(figsize=(10, 10), dpi=150)
    plt.scatter(trajectory[:, 0], trajectory[:, 1], c=np.arange(n_iterations), 
                cmap=cmap, s=0.1, alpha=0.5)
    
    plt.title(f'Tinkerbell Map Trajectory\na={a}, b={b}, c={c}, d={d}', fontsize=14)
    plt.xlabel('x', fontsize=12)
    plt.ylabel('y', fontsize=12)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    # Save the figure
    plt.savefig('tinkerbell_map.png')
    plt.close()
    
    # Also create a zoomed version to show detail
    plt.figure(figsize=(10, 10), dpi=150)
    plt.scatter(trajectory[:, 0], trajectory[:, 1], c=np.arange(n_iterations), 
                cmap=cmap, s=0.5, alpha=0.5)
    
    # Find the center of mass of the attractor
    center_x = np.mean(trajectory[-5000:, 0])
    center_y = np.mean(trajectory[-5000:, 1])
    
    # Set limits to zoom in
    plt.xlim(center_x - 0.5, center_x + 0.5)
    plt.ylim(center_y - 0.5, center_y + 0.5)
    
    plt.title(f'Tinkerbell Map (Zoomed)\na={a}, b={b}, c={c}, d={d}', fontsize=14)
    plt.xlabel('x', fontsize=12)
    plt.ylabel('y', fontsize=12)
    plt.grid(alpha=0.3)
    plt.tight_layout()
    
    # Save the zoomed figure
    plt.savefig('tinkerbell_map_zoomed.png')
    plt.close()

# Create a visualization of multiple trajectories with different starting points
def create_multiple_trajectories(n_trajectories=5, n_iterations=10000):
    """Create a visualization of multiple Tinkerbell map trajectories."""
    plt.figure(figsize=(10, 10), dpi=150)
    
    # Generate different starting points
    np.random.seed(42)
    starting_points = np.random.uniform(-0.5, 0.5, (n_trajectories, 2))
    
    # Different colors for different trajectories
    colors = plt.cm.rainbow(np.linspace(0, 1, n_trajectories))
    
    for i, (x0, y0) in enumerate(starting_points):
        trajectory = generate_trajectory(x0, y0, n_iterations)
        plt.plot(trajectory[:, 0], trajectory[:, 1], '-', color=colors[i], 
                 alpha=0.7, linewidth=0.5, label=f'Start: ({x0:.2f}, {y0:.2f})')
    
    plt.title(f'Multiple Tinkerbell Map Trajectories\na={a}, b={b}, c={c}, d={d}', fontsize=14)
    plt.xlabel('x', fontsize=12)
    plt.ylabel('y', fontsize=12)
    plt.grid(alpha=0.3)
    plt.legend(fontsize=8)
    plt.tight_layout()
    
    # Save the figure
    plt.savefig('tinkerbell_multiple_trajectories.png')
    plt.close()

if __name__ == "__main__":
    create_tinkerbell_visualization()
    create_multiple_trajectories()
    print("Visualizations created successfully!")