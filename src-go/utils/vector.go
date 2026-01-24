package utils

import (
	"fmt"
	"math"
)

// Vector3 represents a 3D vector
type Vector3 struct {
	X, Y, Z float64
}

// NewVector3 creates a new vector
func NewVector3(x, y, z float64) *Vector3 {
	return &Vector3{X: x, Y: y, Z: z}
}

// Clone creates a copy of the vector
func (v *Vector3) Clone() *Vector3 {
	return &Vector3{X: v.X, Y: v.Y, Z: v.Z}
}

// Add adds another vector to this one
func (v *Vector3) Add(other *Vector3) *Vector3 {
	v.X += other.X
	v.Y += other.Y
	v.Z += other.Z
	return v
}

// Sub subtracts another vector from this one
func (v *Vector3) Sub(other *Vector3) *Vector3 {
	v.X -= other.X
	v.Y -= other.Y
	v.Z -= other.Z
	return v
}

// MultiplyScalar multiplies the vector by a scalar
func (v *Vector3) MultiplyScalar(scalar float64) *Vector3 {
	v.X *= scalar
	v.Y *= scalar
	v.Z *= scalar
	return v
}

// Length returns the magnitude of the vector
func (v *Vector3) Length() float64 {
	return math.Sqrt(v.X*v.X + v.Y*v.Y + v.Z*v.Z)
}

// LengthSq returns the squared magnitude (faster, no sqrt)
func (v *Vector3) LengthSq() float64 {
	return v.X*v.X + v.Y*v.Y + v.Z*v.Z
}

// Normalize returns a normalized copy
func (v *Vector3) Normalize() *Vector3 {
	len := v.Length()
	if len == 0 {
		return &Vector3{X: 0, Y: 0, Z: 0}
	}
	return &Vector3{X: v.X / len, Y: v.Y / len, Z: v.Z / len}
}

// Dot returns the dot product
func (v *Vector3) Dot(other *Vector3) float64 {
	return v.X*other.X + v.Y*other.Y + v.Z*other.Z
}

// DistanceTo returns distance to another vector
func (v *Vector3) DistanceTo(other *Vector3) float64 {
	dx := v.X - other.X
	dy := v.Y - other.Y
	dz := v.Z - other.Z
	return math.Sqrt(dx*dx + dy*dy + dz*dz)
}

// DistanceToSq returns squared distance (faster, no sqrt)
func (v *Vector3) DistanceToSq(other *Vector3) float64 {
	dx := v.X - other.X
	dy := v.Y - other.Y
	dz := v.Z - other.Z
	return dx*dx + dy*dy + dz*dz
}

// Copy copies values from another vector
func (v *Vector3) Copy(other *Vector3) *Vector3 {
	v.X = other.X
	v.Y = other.Y
	v.Z = other.Z
	return v
}

// Clamp clamps each component to min/max
func (v *Vector3) Clamp(min, max float64) *Vector3 {
	if v.X < min {
		v.X = min
	} else if v.X > max {
		v.X = max
	}
	if v.Y < min {
		v.Y = min
	} else if v.Y > max {
		v.Y = max
	}
	if v.Z < min {
		v.Z = min
	} else if v.Z > max {
		v.Z = max
	}
	return v
}

// MarshalJSON for JSON serialization
func (v *Vector3) MarshalJSON() ([]byte, error) {
	// Returns JSON array format: [x, y, z]
	return []byte(`[` + fmt.Sprintf("%v", v.X) + `,` + fmt.Sprintf("%v", v.Y) + `,` + fmt.Sprintf("%v", v.Z) + `]`), nil
}
