import { Input, InputGroup, InputProps } from "@chakra-ui/react";
import React, { useState } from "react";

interface QuantityInputProps
  extends Omit<InputProps, "onChange" | "value" | "onBlur" | "max" | "min"> {
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
}

export const QuantityInput: React.FC<QuantityInputProps> = ({
  onChange,
  decimals,
  ...restInputProps
}) => {
  const [stringValue, setStringValue] = useState<string>("1");

  return (
    <InputGroup {...restInputProps} isDisabled={decimals === undefined}>
      <Input
        value={stringValue}
        onChange={(e) => setStringValue(e.target.value)}
        onBlur={() => {
          let _stringValue = stringValue;
          if (!isNaN(Number(stringValue))) {
            _stringValue = Number(
              Number(stringValue).toFixed(decimals),
            ).toString();
          } else {
            _stringValue = "1";
          }
          setStringValue(_stringValue);
          onChange(_stringValue);
        }}
        bgColor="inputBg"
      />
    </InputGroup>
  );
};
