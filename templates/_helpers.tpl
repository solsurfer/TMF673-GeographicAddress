{{/*
Expand the name of the chart.
*/}}
{{- define "geographicaddress.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "geographicaddress.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "geographicaddress.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "geographicaddress.labels" -}}
helm.sh/chart: {{ include "geographicaddress.chart" . }}
{{ include "geographicaddress.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
oda.tmforum.org/componentName: {{ .Release.Name }}-{{ .Values.component.name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "geographicaddress.selectorLabels" -}}
app.kubernetes.io/name: {{ include "geographicaddress.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
