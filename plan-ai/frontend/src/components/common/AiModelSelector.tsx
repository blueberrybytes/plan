import React from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, FormControl, Select, MenuItem, Chip } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useGetModelsQuery } from "../../store/apis/aiApi";

interface AiModelSelectorProps {
  value?: string | null;
  onChange: (modelKey: string | null) => void;
  disabled?: boolean;
}

/**
 * Tags arrive from the backend as raw English keys. They are translated here
 * rather than at the source so the same catalogue serves every locale, and an
 * unknown tag falls back to its own text instead of rendering a missing key.
 */
const UNFILTERED_TAG = "Unfiltered";

const AiModelSelector: React.FC<AiModelSelectorProps> = ({ value, onChange, disabled }) => {
  const { t } = useTranslation();
  const { data: models, isLoading } = useGetModelsQuery();
  const tagLabel = (tag: string) => t(`aiModelTags.${tag}`, { defaultValue: tag });

  React.useEffect(() => {
    // Only attempt to restore once when the component initially mounts with an empty value
    if (!value) {
      const savedModel = localStorage.getItem("preferred_ai_model");
      if (savedModel) {
        onChange(savedModel);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModelChange = (newModel: string) => {
    if (newModel) {
      localStorage.setItem("preferred_ai_model", newModel);
    } else {
      localStorage.removeItem("preferred_ai_model");
    }
    onChange(newModel);
  };

  if (isLoading || !models) {
    return null; // Silent load
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5, mb: 0.5 }}>
      <FormControl size="small" variant="outlined">
        <Select
          value={value || ""}
          onChange={(e) => handleModelChange(e.target.value)}
          disabled={disabled}
          displayEmpty
          renderValue={(selected) => {
            if (!selected) {
              return (
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "text.secondary" }}
                >
                  <AutoAwesomeIcon sx={{ fontSize: 14 }} />
                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    Auto Model
                  </Typography>
                </Box>
              );
            }
            const model = models.find((m) => m.key === selected);
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AutoAwesomeIcon sx={{ fontSize: 14, color: "primary.main" }} />
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {model?.name || selected}
                </Typography>
              </Box>
            );
          }}
          sx={{
            fontSize: "0.75rem",
            height: 28,
            borderRadius: 4,
            backgroundColor: "background.paper",
            boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
            "& .MuiOutlinedInput-notchedOutline": {
              border: "1px solid",
              borderColor: "divider",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
            "& .MuiSelect-select": {
              display: "flex",
              alignItems: "center",
              py: 0,
              pl: 1.5,
              pr: 4, // Make room for dropdown arrow
            },
          }}
        >
          <MenuItem value="">
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Default Auto-Routing (Recommended)
            </Typography>
          </MenuItem>
          {models.map((model) => (
            <MenuItem key={model.key} value={model.key}>
              <Box sx={{ display: "flex", alignItems: "flex-start", flexDirection: "column" }}>
                <Typography variant="body2" fontWeight={600}>
                  {model.name}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                  {model.tags?.map((tag) => {
                    // Called out rather than blended in: choosing a model that
                    // won't refuse is a deliberate decision, so it shouldn't
                    // look like just another capability chip.
                    const unfiltered = tag === UNFILTERED_TAG;
                    return (
                      <Chip
                        key={tag}
                        label={tagLabel(tag)}
                        size="small"
                        variant={unfiltered ? "filled" : "outlined"}
                        color={unfiltered ? "warning" : "default"}
                        sx={{ height: 20, fontSize: "0.65rem" }}
                      />
                    );
                  })}
                </Box>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default AiModelSelector;
