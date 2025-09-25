import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import matplotlib.patches as patches

def create_grid_visualization(rows=8, cols=8, block_size=2):
    """Create a visualization of the transposition grid and blocks."""
    # Create a grid
    grid = np.zeros((rows, cols))
    
    # Fill with sequential numbers for visualization
    for i in range(rows):
        for j in range(cols):
            grid[i, j] = i * cols + j + 1
    
    # Calculate block dimensions
    br = (rows + block_size - 1) // block_size
    bc = (cols + block_size - 1) // block_size
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))
    
    # Plot original grid
    im1 = ax1.imshow(grid, cmap='viridis')
    ax1.set_title('Original Grid', fontsize=14)
    
    # Add grid lines
    for i in range(rows + 1):
        ax1.axhline(i - 0.5, color='black', linewidth=0.5)
    for j in range(cols + 1):
        ax1.axvline(j - 0.5, color='black', linewidth=0.5)
    
    # Add block boundaries with thicker lines
    for i in range(0, rows, block_size):
        ax1.axhline(i - 0.5, color='red', linewidth=2)
    for j in range(0, cols, block_size):
        ax1.axvline(j - 0.5, color='red', linewidth=2)
    ax1.axhline(rows - 0.5, color='red', linewidth=2)
    ax1.axvline(cols - 0.5, color='red', linewidth=2)
    
    # Add text labels
    for i in range(rows):
        for j in range(cols):
            ax1.text(j, i, f'{int(grid[i, j])}', ha='center', va='center', color='white')
    
    # Create a shuffled version for visualization
    np.random.seed(42)  # For reproducibility
    shuffled_grid = grid.copy()
    
    # Shuffle blocks
    block_indices = []
    for r in range(br):
        for c in range(bc):
            r0 = r * block_size
            c0 = c * block_size
            r1 = min(r0 + block_size, rows)
            c1 = min(c0 + block_size, cols)
            block_indices.append((r0, r1, c0, c1))
    
    np.random.shuffle(block_indices)
    
    # Create new grid with shuffled blocks
    new_grid = np.zeros_like(grid)
    for idx, (r0, r1, c0, c1) in enumerate(block_indices):
        orig_r0 = (idx // bc) * block_size
        orig_c0 = (idx % bc) * block_size
        orig_r1 = min(orig_r0 + block_size, rows)
        orig_c1 = min(orig_c0 + block_size, cols)
        
        new_grid[r0:r1, c0:c1] = grid[orig_r0:orig_r1, orig_c0:orig_c1]
    
    # Plot shuffled grid
    im2 = ax2.imshow(new_grid, cmap='viridis')
    ax2.set_title('After Block Transposition', fontsize=14)
    
    # Add grid lines
    for i in range(rows + 1):
        ax2.axhline(i - 0.5, color='black', linewidth=0.5)
    for j in range(cols + 1):
        ax2.axvline(j - 0.5, color='black', linewidth=0.5)
    
    # Add block boundaries with thicker lines
    for i in range(0, rows, block_size):
        ax2.axhline(i - 0.5, color='red', linewidth=2)
    for j in range(0, cols, block_size):
        ax2.axvline(j - 0.5, color='red', linewidth=2)
    ax2.axhline(rows - 0.5, color='red', linewidth=2)
    ax2.axvline(cols - 0.5, color='red', linewidth=2)
    
    # Add text labels
    for i in range(rows):
        for j in range(cols):
            ax2.text(j, i, f'{int(new_grid[i, j])}', ha='center', va='center', color='white')
    
    plt.tight_layout()
    plt.savefig('transposition_grid.png', dpi=150)
    plt.close()

def visualize_block_operations():
    """Create visualizations of the different block operations used in transposition."""
    # Create a sample 4x4 block
    block = np.array([
        [1, 2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
        [13, 14, 15, 16]
    ])
    
    # Define operations and their results
    operations = [
        ("Original", block.copy()),
        ("Swap Rows (0,2)", np.array([
            [9, 10, 11, 12],
            [5, 6, 7, 8],
            [1, 2, 3, 4],
            [13, 14, 15, 16]
        ])),
        ("Swap Columns (1,3)", np.array([
            [1, 4, 3, 2],
            [5, 8, 7, 6],
            [9, 12, 11, 10],
            [13, 16, 15, 14]
        ])),
        ("Reverse Rows", np.array([
            [4, 3, 2, 1],
            [8, 7, 6, 5],
            [12, 11, 10, 9],
            [16, 15, 14, 13]
        ])),
        ("Reverse Columns", np.array([
            [13, 14, 15, 16],
            [9, 10, 11, 12],
            [5, 6, 7, 8],
            [1, 2, 3, 4]
        ])),
        ("Rotate Rows (Shift +1)", np.array([
            [4, 1, 2, 3],
            [8, 5, 6, 7],
            [12, 9, 10, 11],
            [16, 13, 14, 15]
        ]))
    ]
    
    # Create a figure with subplots
    n_ops = len(operations)
    fig, axes = plt.subplots(2, 3, figsize=(15, 10))
    axes = axes.flatten()
    
    # Plot each operation
    for i, (title, data) in enumerate(operations):
        ax = axes[i]
        im = ax.imshow(data, cmap='viridis')
        ax.set_title(title, fontsize=14)
        
        # Add grid lines
        for j in range(5):
            ax.axhline(j - 0.5, color='black', linewidth=0.5)
            ax.axvline(j - 0.5, color='black', linewidth=0.5)
        
        # Add text labels
        for r in range(4):
            for c in range(4):
                ax.text(c, r, f'{int(data[r, c])}', ha='center', va='center', color='white', fontsize=12)
    
    plt.tight_layout()
    plt.savefig('block_operations.png', dpi=150)
    plt.close()

def visualize_transposition_process():
    """Create a visualization of the complete transposition process."""
    # Parameters
    rows, cols = 8, 8
    block_size = 2
    
    # Create a grid with sequential numbers
    grid = np.zeros((rows, cols))
    for i in range(rows):
        for j in range(cols):
            grid[i, j] = i * cols + j + 1
    
    # Calculate block dimensions
    br = (rows + block_size - 1) // block_size
    bc = (cols + block_size - 1) // block_size
    total_blocks = br * bc
    
    # Create figure with 4 subplots showing the process
    fig, axes = plt.subplots(2, 2, figsize=(16, 16))
    axes = axes.flatten()
    
    # 1. Original grid
    ax = axes[0]
    im = ax.imshow(grid, cmap='viridis')
    ax.set_title('1. Original Grid', fontsize=14)
    
    # Add grid lines and block boundaries
    for i in range(rows + 1):
        ax.axhline(i - 0.5, color='black', linewidth=0.5)
    for j in range(cols + 1):
        ax.axvline(j - 0.5, color='black', linewidth=0.5)
    
    for i in range(0, rows, block_size):
        ax.axhline(i - 0.5, color='red', linewidth=2)
    for j in range(0, cols, block_size):
        ax.axvline(j - 0.5, color='red', linewidth=2)
    ax.axhline(rows - 0.5, color='red', linewidth=2)
    ax.axvline(cols - 0.5, color='red', linewidth=2)
    
    # Add text labels
    for i in range(rows):
        for j in range(cols):
            ax.text(j, i, f'{int(grid[i, j])}', ha='center', va='center', color='white')
    
    # 2. Grid with block indices
    ax = axes[1]
    block_grid = np.zeros((rows, cols))
    for r in range(br):
        for c in range(bc):
            block_idx = r * bc + c
            r0 = r * block_size
            c0 = c * block_size
            r1 = min(r0 + block_size, rows)
            c1 = min(c0 + block_size, cols)
            block_grid[r0:r1, c0:c1] = block_idx
    
    im = ax.imshow(block_grid, cmap='tab20')
    ax.set_title('2. Grid with Block Indices', fontsize=14)
    
    # Add grid lines and block boundaries
    for i in range(rows + 1):
        ax.axhline(i - 0.5, color='black', linewidth=0.5)
    for j in range(cols + 1):
        ax.axvline(j - 0.5, color='black', linewidth=0.5)
    
    for i in range(0, rows, block_size):
        ax.axhline(i - 0.5, color='red', linewidth=2)
    for j in range(0, cols, block_size):
        ax.axvline(j - 0.5, color='red', linewidth=2)
    ax.axhline(rows - 0.5, color='red', linewidth=2)
    ax.axvline(cols - 0.5, color='red', linewidth=2)
    
    # Add block index labels
    for r in range(br):
        for c in range(bc):
            block_idx = r * bc + c
            r_center = r * block_size + block_size // 2
            c_center = c * block_size + block_size // 2
            if r_center < rows and c_center < cols:
                ax.text(c_center, r_center, f'Block {block_idx}', 
                        ha='center', va='center', color='black', fontweight='bold')
    
    # 3. After block permutation (before internal operations)
    ax = axes[2]
    
    # Create a shuffled version
    np.random.seed(42)  # For reproducibility
    
    # Generate block mapping
    block_mapping = list(range(total_blocks))
    np.random.shuffle(block_mapping)
    
    # Create new grid with shuffled blocks
    shuffled_grid = np.zeros_like(grid)
    for dst_idx in range(total_blocks):
        src_idx = block_mapping[dst_idx]
        
        # Source block coordinates
        src_r = src_idx // bc
        src_c = src_idx % bc
        src_r0 = src_r * block_size
        src_c0 = src_c * block_size
        src_r1 = min(src_r0 + block_size, rows)
        src_c1 = min(src_c0 + block_size, cols)
        
        # Destination block coordinates
        dst_r = dst_idx // bc
        dst_c = dst_idx % bc
        dst_r0 = dst_r * block_size
        dst_c0 = dst_c * block_size
        dst_r1 = min(dst_r0 + block_size, rows)
        dst_c1 = min(dst_c0 + block_size, cols)
        
        # Copy block
        shuffled_grid[dst_r0:dst_r1, dst_c0:dst_c1] = grid[src_r0:src_r1, src_c0:src_c1]
    
    im = ax.imshow(shuffled_grid, cmap='viridis')
    ax.set_title('3. After Block Permutation', fontsize=14)
    
    # Add grid lines and block boundaries
    for i in range(rows + 1):
        ax.axhline(i - 0.5, color='black', linewidth=0.5)
    for j in range(cols + 1):
        ax.axvline(j - 0.5, color='black', linewidth=0.5)
    
    for i in range(0, rows, block_size):
        ax.axhline(i - 0.5, color='red', linewidth=2)
    for j in range(0, cols, block_size):
        ax.axvline(j - 0.5, color='red', linewidth=2)
    ax.axhline(rows - 0.5, color='red', linewidth=2)
    ax.axvline(cols - 0.5, color='red', linewidth=2)
    
    # Add text labels
    for i in range(rows):
        for j in range(cols):
            ax.text(j, i, f'{int(shuffled_grid[i, j])}', ha='center', va='center', color='white')
    
    # 4. After internal block operations
    ax = axes[3]
    
    # Apply some operations to blocks (for visualization)
    final_grid = shuffled_grid.copy()
    for dst_idx in range(total_blocks):
        # Destination block coordinates
        dst_r = dst_idx // bc
        dst_c = dst_idx % bc
        dst_r0 = dst_r * block_size
        dst_c0 = dst_c * block_size
        dst_r1 = min(dst_r0 + block_size, rows)
        dst_c1 = min(dst_c0 + block_size, cols)
        
        # Extract block
        block = final_grid[dst_r0:dst_r1, dst_c0:dst_c1].copy()
        
        # Apply a random operation based on block index
        op_type = dst_idx % 3
        if op_type == 0 and block.shape[0] > 1:
            # Swap rows
            if block.shape[0] >= 2:
                block[[0, -1]] = block[[-1, 0]]
        elif op_type == 1 and block.shape[1] > 1:
            # Swap columns
            if block.shape[1] >= 2:
                block[:, [0, -1]] = block[:, [-1, 0]]
        elif op_type == 2:
            # Reverse rows
            block = np.flip(block, axis=1)
        
        # Put block back
        final_grid[dst_r0:dst_r1, dst_c0:dst_c1] = block
    
    im = ax.imshow(final_grid, cmap='viridis')
    ax.set_title('4. After Internal Block Operations', fontsize=14)
    
    # Add grid lines and block boundaries
    for i in range(rows + 1):
        ax.axhline(i - 0.5, color='black', linewidth=0.5)
    for j in range(cols + 1):
        ax.axvline(j - 0.5, color='black', linewidth=0.5)
    
    for i in range(0, rows, block_size):
        ax.axhline(i - 0.5, color='red', linewidth=2)
    for j in range(0, cols, block_size):
        ax.axvline(j - 0.5, color='red', linewidth=2)
    ax.axhline(rows - 0.5, color='red', linewidth=2)
    ax.axvline(cols - 0.5, color='red', linewidth=2)
    
    # Add text labels
    for i in range(rows):
        for j in range(cols):
            ax.text(j, i, f'{int(final_grid[i, j])}', ha='center', va='center', color='white')
    
    plt.tight_layout()
    plt.savefig('transposition_process.png', dpi=150)
    plt.close()

if __name__ == "__main__":
    create_grid_visualization()
    visualize_block_operations()
    visualize_transposition_process()
    print("Transposition visualizations created successfully!")