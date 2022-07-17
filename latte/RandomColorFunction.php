<?php

namespace App\Latte;

use Exception;

class RandomColorFunction {
    /**
     * @throws Exception
     */
    public static function execute(): string {
        return sprintf('#%06X', random_int(0, 0xFFFFFF));
    }
}
