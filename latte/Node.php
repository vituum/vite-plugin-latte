<?php

namespace App\Latte;

use JsonException;

class Node
{
    /**
     * @throws JsonException
     */
    public static function execute($value, $param1 = null, $param2 = null, $param3 = null, $param4 = null): string
    {
        $params = [
            'value' => $value,
            'param1' => $param1,
            'param2' => $param2,
            'param3' => $param3,
            'param4' => $param4
        ];

        exec('node handler.js ' . json_encode($params, JSON_THROW_ON_ERROR), $output);

        return $output[0] ?? $value;
    }
}
