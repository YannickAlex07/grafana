package v0alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type SecureValue struct {
	metav1.TypeMeta `json:",inline"`

	// Standard object's metadata. It can only be one of `metav1.ObjectMeta` or `metav1.ListMeta`.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ObjectMeta `json:"metadata"`

	// This is the actual secure value schema.
	Spec SecureValueSpec `json:"spec"`

	// Read-only observed status of the `SecureValue`.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#spec-and-status
	Status SecureValueStatus `json:"status"`
}

type SecureValueStatus struct {
	Version int64 `json:"version"`

	// +optional
	ExternalID string `json:"externalId,omitempty"`
}

type SecureValueSpec struct {
	// Short description that explains the purpose of this SecureValue.
	// +k8s:validation:minLength=1
	// +k8s:validation:maxLength=253
	Description string `json:"description"`

	// The raw value is only valid for write. Read/List will always be empty.
	// There is no support for mixing `value` and `ref`, you can't create a secret in a third-party keeper with a specified `ref`.
	// Minimum and maximum lengths in bytes.
	// +k8s:validation:minLength=1
	// +k8s:validation:maxLength=24576
	Value ExposedSecureValue `json:"value,omitempty"`

	// When using a third-party keeper, the `ref` is used to reference a value inside the remote storage.
	// This should not contain sensitive information.
	// +k8s:validation:minLength=1
	// +k8s:validation:maxLength=1024
	// +optional
	Ref *string `json:"ref,omitempty"`

	// Name of the keeper, being the actual storage of the secure value.
	// If not specified, the default keeper for the namespace will be used.
	// +k8s:validation:minLength=1
	// +k8s:validation:maxLength=253
	// +optional
	Keeper *string `json:"keeper,omitempty"`

	// The Decrypters that are allowed to decrypt this secret.
	// An empty list means no service can decrypt it.
	// +k8s:validation:maxItems=64
	// +k8s:validation:uniqueItems=true
	// +listType=atomic
	// +optional
	Decrypters []string `json:"decrypters"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type SecureValueList struct {
	metav1.TypeMeta `json:",inline"`

	// Standard list's metadata. It can only be one of `metav1.ObjectMeta` or `metav1.ListMeta`.
	// More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
	// +optional
	metav1.ListMeta `json:"metadata"`

	// Slice containing all secure values. This will NOT output decrypted values.
	Items []SecureValue `json:"items"`
}
